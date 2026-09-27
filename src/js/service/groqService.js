import $ from '../externals/jquery.js';
import { constants } from '../util/constants.js';
import { i18nService } from './i18nService.js';
import { dataService } from './data/dataService.js';
import { localStorageService } from './data/localStorageService.js';
import { grammarProfileRegistry } from './groq/grammarProfileRegistry.js';

let groqService = {};

groqService.MODELS = [
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (Recomendado - Mayor precisión)' },
    { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B (Ultra rápido)' }
];
groqService.DEFAULT_MODEL = 'openai/gpt-oss-120b';

// --- GESTIÓN Y VINCULACIÓN AL USUARIO ACTIVO ---
function getCurrentUser() {
    try {
        if (dataService && dataService.getCurrentUser) {
            let u = dataService.getCurrentUser();
            if (u) return u;
        }
    } catch (e) {}
    try {
        if (localStorageService) {
            let u = localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
            if (u) return u;
        }
    } catch (e) {}
    return 'default_user';
}

function getSafeUserKey() {
    let u = getCurrentUser();
    return (u || 'default_user').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

function getCacheStorageKey() {
    return 'asterics_groq_cache_v3_' + getSafeUserKey();
}

function getRecentStorageKey() {
    return 'asterics_groq_recent_' + getSafeUserKey();
}

// --- ESTADO DE CONEXIÓN Y SERVICIO ---
let currentGroqStatus = 'online'; // 'online' | 'cache' | 'fallback'

groqService.getStatus = function() {
    return currentGroqStatus;
};

groqService.setStatus = function(status) {
    currentGroqStatus = status;
    try {
        $(document).trigger(constants.EVENT_GROQ_STATUS_CHANGED, [status]);
    } catch (e) {}
};

// --- HISTORIAL DE FRASES RECIENTES (Vinculado por Usuario) ---
const MAX_RECENT_PHRASES = 10;

groqService.getRecentPhrases = function() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            let storageKey = getRecentStorageKey();
            let data = window.localStorage.getItem(storageKey);
            if (!data) {
                let legacy = window.localStorage.getItem('asterics_groq_recent');
                if (legacy) {
                    window.localStorage.setItem(storageKey, legacy);
                    data = legacy;
                }
            }
            return data ? JSON.parse(data) : [];
        }
    } catch (e) {}
    return [];
};

groqService.addRecentPhrase = function(spokenText, rawText) {
    if (!spokenText || typeof spokenText !== 'string' || !spokenText.trim()) return;
    try {
        let list = groqService.getRecentPhrases();
        const cleanSpoken = spokenText.trim();
        const currentUser = getCurrentUser();
        // Si ya está primera, no duplicar
        if (list.length > 0 && list[0].text.toLowerCase() === cleanSpoken.toLowerCase()) {
            return;
        }
        // Quitar duplicados previos
        list = list.filter(item => item.text.toLowerCase() !== cleanSpoken.toLowerCase());
        list.unshift({
            text: cleanSpoken,
            rawText: rawText || '',
            userId: currentUser,
            timestamp: Date.now()
        });
        if (list.length > MAX_RECENT_PHRASES) {
            list = list.slice(0, MAX_RECENT_PHRASES);
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(getRecentStorageKey(), JSON.stringify(list));
        }
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED, [list]);
    } catch (e) {}
};

groqService.clearRecentPhrases = function() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(getRecentStorageKey());
        }
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED, [[]]);
    } catch (e) {}
};

// --- CACHÉ LOCAL Y BASE DE DATOS SINCRONIZADA (Aislada por Usuario) ---
const MAX_CACHE_ENTRIES = 5000;
let memoryCache = null;
let memoryCacheUser = null;

function getPhraseDocId(key) {
    let clean = (key || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (clean.length > 70) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0;
        }
        clean = clean.substring(0, 50) + '_' + Math.abs(hash).toString(36);
    }
    return 'groqphrase_' + clean;
}

function getTombstoneStorageKey() {
    return 'asterics_groq_tombstones_v3_' + getSafeUserKey();
}

function getGlobalPurgeStorageKey() {
    return 'asterics_groq_purge_v3_' + getSafeUserKey();
}

function getLocalTombstones() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            let data = window.localStorage.getItem(getTombstoneStorageKey());
            return data ? JSON.parse(data) : {};
        }
    } catch (e) {}
    return {};
}

function recordLocalTombstone(key, timestamp) {
    try {
        if (!key) return;
        let map = getLocalTombstones();
        map[key] = timestamp || Date.now();
        let keys = Object.keys(map);
        if (keys.length > 5000) {
            delete map[keys[0]];
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(getTombstoneStorageKey(), JSON.stringify(map));
        }
    } catch (e) {}
}

function removeLocalTombstone(key) {
    try {
        let map = getLocalTombstones();
        if (map[key]) {
            delete map[key];
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(getTombstoneStorageKey(), JSON.stringify(map));
            }
        }
    } catch (e) {}
}

function isLocalTombstoned(key, itemTimestamp) {
    let map = getLocalTombstones();
    let deletedAt = map[key];
    if (!deletedAt) return false;
    if (itemTimestamp && itemTimestamp > deletedAt) {
        return false;
    }
    return true;
}

function getLocalPurgeTime() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            let data = window.localStorage.getItem(getGlobalPurgeStorageKey());
            return data ? parseInt(data, 10) || 0 : 0;
        }
    } catch (e) {}
    return 0;
}

function setLocalPurgeTime(ts) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(getGlobalPurgeStorageKey(), (ts || Date.now()).toString());
        }
    } catch (e) {}
}

function getCache() {
    let currentUser = getSafeUserKey();
    if (!memoryCache || memoryCacheUser !== currentUser) {
        memoryCache = new Map();
        memoryCacheUser = currentUser;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                let storageKey = getCacheStorageKey();
                let stored = window.localStorage.getItem(storageKey);
                if (!stored) {
                    let legacy = window.localStorage.getItem('asterics_groq_cache_v3');
                    if (legacy) {
                        window.localStorage.setItem(storageKey, legacy);
                        stored = legacy;
                    }
                }
                if (stored) {
                    let parsed = JSON.parse(stored);
                    let purgeTime = getLocalPurgeTime();
                    Object.keys(parsed).forEach(k => {
                        let item = parsed[k];
                        let ts = (typeof item === 'object' && item && item.timestamp) ? item.timestamp : 0;
                        if (purgeTime > 0 && ts > 0 && ts <= purgeTime) {
                            return;
                        }
                        if (isLocalTombstoned(k, ts)) {
                            return;
                        }
                        if (typeof item === 'string') {
                            memoryCache.set(k, { sentence: item, rawText: '', timestamp: Date.now(), userId: getCurrentUser() });
                        } else if (item && typeof item === 'object') {
                            memoryCache.set(k, item);
                        }
                    });
                }
            }
        } catch (e) {}
    }
    return memoryCache;
}

function setCache(key, value, rawText, options = {}) {
    try {
        removeLocalTombstone(key);
        let cache = getCache();
        let currentUser = getCurrentUser();
        const sentence = typeof value === 'string' ? value : ((value && value.sentence) || '');
        const raw = rawText || (typeof value === 'object' && value ? value.rawText : '') || '';
        const timestamp = Date.now();
        const entry = {
            sentence: sentence,
            rawText: raw,
            timestamp: timestamp,
            userId: currentUser
        };
        cache.set(key, entry);
        if (cache.size > MAX_CACHE_ENTRIES) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            let obj = {};
            cache.forEach((v, k) => { obj[k] = v; });
            window.localStorage.setItem(getCacheStorageKey(), JSON.stringify(obj));
        }

        // Persistir en la base de datos PouchDB / CouchDB del usuario activo
        let docId = getPhraseDocId(key);
        let phraseDoc = {
            id: docId,
            userId: currentUser,
            phraseKey: key,
            rawText: raw,
            sentence: sentence,
            lang: (options && options.lang) || i18nService.getContentLangBase() || 'es',
            gender: (options && options.gender) || 'neutral',
            complexity: (options && options.complexity) || 'intermediate',
            model: (options && options.model) || groqService.DEFAULT_MODEL,
            userContext: (options && options.userContext) || '',
            timestamp: timestamp,
            deleted: false,
            deletedAt: 0
        };
        if (dataService && dataService.saveGroqPhrase) {
            dataService.saveGroqPhrase(phraseDoc).catch(e => {
                log.debug('[Groq] Error al guardar frase en base de datos:', e);
            });
        }
    } catch (e) {}
}

/**
 * Sincroniza las frases de la base de datos remota/local con la caché en memoria y localStorage del usuario activo.
 * Gestiona de forma bidireccional los tombstones (marcas de borrado) para evitar resurrecciones de frases entre dispositivos.
 */
groqService.syncFromDatabase = async function() {
    try {
        if (!dataService || !dataService.getGroqPhrases) return;
        let currentUser = getCurrentUser();
        let currentSafeKey = getSafeUserKey();
        let dbPhrases = await dataService.getGroqPhrases();
        let cache = getCache();
        let updatedFromDb = false;

        let localPurgeTime = getLocalPurgeTime();

        // 1. Detectar marcador global de purga en la base de datos
        let globalPurgeDoc = dbPhrases && dbPhrases.find(doc =>
            doc && (doc.id === 'groqphrase_tombstone_global' || doc.phraseKey === '__GLOBAL_PURGE__')
        );
        if (globalPurgeDoc) {
            let remotePurgeTime = globalPurgeDoc.deletedAt || globalPurgeDoc.timestamp || 0;
            if (remotePurgeTime > localPurgeTime) {
                localPurgeTime = remotePurgeTime;
                setLocalPurgeTime(localPurgeTime);
                cache.forEach((entry, key) => {
                    let ts = (entry && entry.timestamp) || 0;
                    if (ts <= localPurgeTime) {
                        cache.delete(key);
                        updatedFromDb = true;
                    }
                });
            }
        }

        if (dbPhrases && dbPhrases.length > 0) {
            dbPhrases.forEach(doc => {
                if (!doc) return;
                if (doc.id === 'groqphrase_tombstone_global' || doc.phraseKey === '__GLOBAL_PURGE__') return;

                let isUserMatch = !doc.userId ||
                    doc.userId.toLowerCase() === currentUser.toLowerCase() ||
                    doc.userId.toLowerCase() === currentSafeKey;
                if (!isUserMatch) return;

                let phraseKey = doc.phraseKey || '';
                if (!phraseKey) return;

                // 2. Procesar marcas de borrado (Tombstones) individuales
                if (doc.deleted === true || (doc.deletedAt && doc.deletedAt > 0)) {
                    let delTime = doc.deletedAt || doc.timestamp || Date.now();
                    recordLocalTombstone(phraseKey, delTime);
                    if (cache.has(phraseKey)) {
                        let existing = cache.get(phraseKey);
                        let exTs = (existing && existing.timestamp) || 0;
                        if (exTs <= delTime) {
                            cache.delete(phraseKey);
                            updatedFromDb = true;
                        }
                    }
                    return;
                }

                // 3. Procesar frases activas
                let docTs = doc.timestamp || 0;
                if (localPurgeTime > 0 && docTs > 0 && docTs <= localPurgeTime) {
                    return; // Ignorar frase previa a la purga global
                }
                if (isLocalTombstoned(phraseKey, docTs)) {
                    return; // Ignorar frase eliminada localmente
                }

                if (doc.sentence) {
                    let existing = cache.get(phraseKey);
                    if (!existing || !existing.timestamp || docTs >= existing.timestamp) {
                        cache.set(phraseKey, {
                            sentence: doc.sentence,
                            rawText: doc.rawText || '',
                            timestamp: docTs || Date.now(),
                            userId: currentUser
                        });
                        updatedFromDb = true;
                    }
                }
            });
        }

        // 4. Subir frases locales nuevas generadas offline SOLO si no han sido eliminadas o purgadas
        cache.forEach((entry, key) => {
            let entryTs = (entry && entry.timestamp) || 0;
            if (localPurgeTime > 0 && entryTs > 0 && entryTs <= localPurgeTime) {
                return;
            }
            if (isLocalTombstoned(key, entryTs)) {
                return;
            }
            let foundInDb = dbPhrases && dbPhrases.some(p => p && p.phraseKey === key && !p.deleted);
            if (!foundInDb && entry && entry.sentence) {
                let docId = getPhraseDocId(key);
                if (dataService && dataService.saveGroqPhrase) {
                    dataService.saveGroqPhrase({
                        id: docId,
                        userId: currentUser,
                        phraseKey: key,
                        rawText: entry.rawText || '',
                        sentence: entry.sentence,
                        timestamp: entryTs || Date.now(),
                        deleted: false,
                        deletedAt: 0
                    }).catch(() => {});
                }
            }
        });

        if (updatedFromDb && typeof window !== 'undefined' && window.localStorage) {
            let obj = {};
            cache.forEach((v, k) => { obj[k] = v; });
            window.localStorage.setItem(getCacheStorageKey(), JSON.stringify(obj));
        }
        try {
            $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED);
        } catch (e) {}
    } catch (e) {
        log.debug('[Groq] Error al sincronizar desde BD:', e);
    }
};

/**
 * Obtiene todas las entradas del diccionario de frases en caché para visualización/edición.
 * @returns {Array<{key: string, rawText: string, sentence: string, timestamp: number}>}
 */
groqService.getDictionaryEntries = function() {
    const cache = getCache();
    const list = [];
    cache.forEach((val, key) => {
        let sentence = typeof val === 'string' ? val : (val && val.sentence) || '';
        let rawText = (typeof val === 'object' && val && val.rawText) ? val.rawText : '';
        if (!rawText) {
            const parts = key.split('_');
            rawText = parts.length > 5 ? parts.slice(5).join(' ') : key;
        }
        list.push({
            key: key,
            rawText: rawText,
            sentence: sentence,
            timestamp: (typeof val === 'object' && val && val.timestamp) || 0
        });
    });
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

groqService.getDictionaryCount = function() {
    return getCache().size;
};

groqService.updateDictionaryEntry = function(key, newSentence, newRawText) {
    if (!key) return false;
    removeLocalTombstone(key);
    const cache = getCache();
    const cleanSentence = (newSentence || '').trim();
    if (!cleanSentence) return false;

    let currentUser = getCurrentUser();
    let existing = cache.get(key) || {};
    let raw = newRawText !== undefined ? newRawText.trim() : (existing.rawText || '');
    const timestamp = Date.now();
    cache.set(key, {
        sentence: cleanSentence,
        rawText: raw,
        timestamp: timestamp,
        userId: currentUser
    });
    if (typeof window !== 'undefined' && window.localStorage) {
        let obj = {};
        cache.forEach((v, k) => { obj[k] = v; });
        window.localStorage.setItem(getCacheStorageKey(), JSON.stringify(obj));
    }

    // Actualizar en base de datos PouchDB / CouchDB del usuario activo
    let docId = getPhraseDocId(key);
    if (dataService && dataService.saveGroqPhrase) {
        dataService.saveGroqPhrase({
            id: docId,
            userId: currentUser,
            phraseKey: key,
            rawText: raw,
            sentence: cleanSentence,
            timestamp: timestamp,
            deleted: false,
            deletedAt: 0
        }).catch(() => {});
    }

    return true;
};

groqService.deleteDictionaryEntry = async function(key) {
    if (!key) return false;
    const cache = getCache();
    const deleted = cache.delete(key);
    const now = Date.now();
    recordLocalTombstone(key, now);

    if (typeof window !== 'undefined' && window.localStorage) {
        let obj = {};
        cache.forEach((v, k) => { obj[k] = v; });
        window.localStorage.setItem(getCacheStorageKey(), JSON.stringify(obj));
    }
    // Eliminar de base de datos PouchDB / CouchDB del usuario activo (dispositivo y servidor con tombstone)
    let docId = getPhraseDocId(key);
    if (dataService && dataService.deleteGroqPhrase) {
        try {
            await dataService.deleteGroqPhrase(key);
            if (docId !== key) {
                await dataService.deleteGroqPhrase(docId);
            }
        } catch (e) {
            log.debug('[Groq] Error al eliminar frase de la base de datos:', e);
        }
    }
    try {
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED);
    } catch (e) {}

    return deleted;
};

groqService.addCustomDictionaryEntry = function(rawText, sentence, options = {}) {
    if (!rawText || !sentence) return false;
    const cleanRaw = rawText.trim();
    const cleanSentence = sentence.trim();
    if (!cleanRaw || !cleanSentence) return false;

    let targetLangCode = options.lang || i18nService.getContentLangBase() || 'es';
    let gender = options.gender || 'neutral';
    let complexity = options.complexity || 'intermediate';
    let model = options.model || groqService.DEFAULT_MODEL;
    let userContext = options.userContext || '';
    const userContextHash = userContext && userContext.trim() ? '_' + userContext.trim().toLowerCase().slice(0, 20).replace(/[^a-z0-9]/g, '') : '';
    const normalizedRaw = groqService.normalizeAccents ? groqService.normalizeAccents(cleanRaw) : cleanRaw;
    const key = `v3_${targetLangCode}_${gender}_${complexity}_${model}${userContextHash}_${normalizedRaw.toLowerCase()}`;

    setCache(key, cleanSentence, cleanRaw, {
        lang: targetLangCode,
        gender: gender,
        complexity: complexity,
        model: model,
        userContext: userContext
    });
    return true;
};

groqService.clearDictionary = async function() {
    const cache = getCache();
    cache.clear();
    const now = Date.now();
    setLocalPurgeTime(now);

    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(getCacheStorageKey());
        window.localStorage.removeItem(getTombstoneStorageKey());
    }
    // Eliminar todas las frases de la base de datos PouchDB / CouchDB con marcador global de purga
    if (dataService && dataService.clearGroqPhrases) {
        try {
            await dataService.clearGroqPhrases();
        } catch (e) {
            log.debug('[Groq] Error al vaciar frases de la base de datos:', e);
        }
    }
    try {
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED);
    } catch (e) {}
};

/**
 * Colapsa repeticiones involuntarias consecutivas de palabras/pictos.
 * Ej: "yo yo quiero ir parque parque" -> "yo quiero ir parque"
 */
groqService.cleanDoubleTaps = function(text) {
    if (!text || typeof text !== 'string') return '';
    const words = text.trim().split(/[\s,]+/);
    const cleaned = [];
    for (let i = 0; i < words.length; i++) {
        const word = words[i].trim();
        if (!word) continue;
        if (cleaned.length > 0 && cleaned[cleaned.length - 1].toLowerCase() === word.toLowerCase()) {
            continue;
        }
        cleaned.push(word);
    }
    return cleaned.join(' ');
};

/**
 * Normaliza palabras cotidianas comunes en CAA que suelen perder la tilde o grafía
 */
groqService.normalizeAccents = function(text) {
    if (!text || typeof text !== 'string') return '';
    const map = {
        'papa': 'papá',
        'mama': 'mamá',
        'bebe': 'bebé',
        'tia': 'tía',
        'tio': 'tío',
        'musica': 'música',
        'platano': 'plátano',
        'bano': 'baño',
        'adios': 'adiós'
    };
    return text.split(/([\s,]+)/).map(token => {
        const lower = token.toLowerCase();
        return map[lower] ? map[lower] : token;
    }).join('');
};

/**
 * Analizadores heurísticos delegados al registro de perfiles gramaticales según el idioma
 */
groqService.analyzePositionalSemantics = function(pictos, lang = 'es') {
    return grammarProfileRegistry.getProfile(lang).analyzePositionalSemantics(pictos);
};

groqService.analyzeTemporalContext = function(pictos, lang = 'es') {
    return grammarProfileRegistry.getProfile(lang).analyzeTemporalContext(pictos);
};

groqService.analyzeSpeechAct = function(pictos, lang = 'es') {
    return grammarProfileRegistry.getProfile(lang).analyzeSpeechAct(pictos);
};

groqService.analyzePsychologicalAndPhysicalVerbs = function(pictos, lang = 'es') {
    return grammarProfileRegistry.getProfile(lang).analyzePsychologicalAndPhysicalVerbs(pictos);
};

groqService.analyzeQuantifiersAndNumbers = function(pictos, lang = 'es') {
    return grammarProfileRegistry.getProfile(lang).analyzeQuantifiersAndNumbers(pictos);
};

groqService.analyzeConnectors = function(pictos, lang = 'es') {
    return grammarProfileRegistry.getProfile(lang).analyzeConnectors(pictos);
};

/**
 * Valida una API key de Groq contra el endpoint de modelos
 * @param {string} apiKey 
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
groqService.validateApiKey = async function(apiKey) {
    if (!apiKey || !apiKey.trim()) {
        return { valid: false, error: 'Empty API key' };
    }
    const cleanKey = apiKey.trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cleanKey}`
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            return { valid: true };
        }
        let errorData = null;
        try {
            errorData = await response.json();
        } catch (e) {}
        const errorMsg = (errorData && errorData.error && errorData.error.message) || `Error ${response.status}: ${response.statusText}`;
        return { valid: false, error: errorMsg };
    } catch (e) {
        clearTimeout(timeoutId);
        return { valid: false, error: e.name === 'AbortError' ? 'Timeout de conexión' : (e.message || 'Error de conexión') };
    }
};

/**
 * Obtiene la frase conjugada y gramaticalmente natural a través de Groq
 * @param {string} text - Secuencia de palabras/pictogramas a conjugar
 * @param {object} [options]
 * @param {string} [options.apiKey]
 * @param {string} [options.model]
 * @param {string} [options.gender] - 'male', 'female', 'neutral'
 * @param {string} [options.complexity] - 'basic', 'intermediate', 'advanced'
 * @param {string} [options.lang]
 * @returns {Promise<string>}
 */
groqService.getCorrectGrammar = async function(text, options = {}) {
    if (!text || !text.trim()) {
        return text;
    }

    // 1. Limpieza de dobles pulsaciones consecutivas
    const cleanedText = groqService.cleanDoubleTaps(text);
    if (!cleanedText) {
        return text;
    }

    // 2. Normalización de palabras clave y tildes habituales (ej: "papa" -> "papá", "mama" -> "mamá")
    const normalizedText = groqService.normalizeAccents(cleanedText);

    let apiKey = options.apiKey;
    let model = options.model;
    let gender = options.gender;
    let complexity = options.complexity;
    let userContext = options.userContext;

    // Recuperar configuración de appSettings y metadata si faltan datos
    let appSettings = null;
    try {
        appSettings = localStorageService.getAppSettings();
    } catch (e) {}

    let metadata = null;
    try {
        metadata = await dataService.getMetadata();
    } catch (e) {}

    apiKey = apiKey || (appSettings && appSettings.groqApiKey) || (metadata && metadata.groqApiKey);
    model = model || (appSettings && appSettings.groqModel) || (metadata && metadata.groqModel) || groqService.DEFAULT_MODEL;
    gender = gender || (appSettings && appSettings.groqGender) || (metadata && metadata.groqGender) || 'neutral';
    complexity = complexity || (appSettings && appSettings.groqComplexity) || (metadata && metadata.groqComplexity) || 'intermediate';
    userContext = userContext || (appSettings && appSettings.groqUserContext) || (metadata && metadata.groqUserContext) || '';

    let targetLangCode = options.lang || i18nService.getContentLangBase() || 'es';
    let targetLangName = i18nService.getLangReadable(targetLangCode) || 'Spanish';

    // 3. Comprobación en CACHÉ LOCAL (Latencia 0ms, 0 tokens, funciona offline)
    const userContextHash = userContext && userContext.trim() ? '_' + userContext.trim().toLowerCase().slice(0, 20).replace(/[^a-z0-9]/g, '') : '';
    const cacheKey = `v3_${targetLangCode}_${gender}_${complexity}_${model}${userContextHash}_${normalizedText.toLowerCase()}`;
    const cache = getCache();
    if (cache.has(cacheKey)) {
        const cachedItem = cache.get(cacheKey);
        const cachedSentence = typeof cachedItem === 'string' ? cachedItem : (cachedItem && cachedItem.sentence);
        if (cachedSentence) {
            console.log(`[Groq Cache HIT 0ms] "${normalizedText}" -> "${cachedSentence}"`);
            groqService.setStatus('cache');
            groqService.addRecentPhrase(cachedSentence, normalizedText);
            return cachedSentence;
        }
    }

    if (!apiKey || !apiKey.trim()) {
        console.warn('[Groq] API Key no configurada, devolviendo texto con dobles pulsaciones limpiadas');
        return normalizedText;
    }

    // 4. Obtener el perfil gramatical correspondiente para el idioma del tablero
    const profile = grammarProfileRegistry.getProfile(targetLangCode);

    // Crear representación secuencial explícita de los pictogramas y extraer restricciones exclusivas del idioma
    const pictos = normalizedText.split(/[\s,]+/);
    const sequenceNotation = pictos.map((p) => `[${p}]`).join(' -> ');
    const combinedConstraints = profile.analyzeAll(pictos);

    // Construir el System Prompt exclusivo del idioma
    const systemPrompt = profile.buildSystemPrompt({
        gender,
        complexity,
        userContext
    });

    const userMessageContent = `Sequence: ${sequenceNotation}\nPictograms: ${normalizedText}${combinedConstraints ? `\n${combinedConstraints}` : ''}`;

    const requestBody = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessageContent }
        ],
        temperature: 0.1,
        max_completion_tokens: 400
    };

    // Parámetros específicos para modelos de razonamiento (gpt-oss)
    if (model.includes('gpt-oss')) {
        requestBody.reasoning_format = 'hidden';
        requestBody.reasoning_effort = 'low';
    }

    // Timeout estricto de 2.5 segundos para no hacer esperar al niño
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
        console.log(`[Groq] Enviando petición a Groq (${model}, lang=${targetLangCode}, gender=${gender}, complexity=${complexity}):`, normalizedText);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Groq] Error status ${response.status} de la API:`, errText);
            return normalizedText;
        }

        const data = await response.json();
        console.log('[Groq] Respuesta bruta de Groq:', data);

        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            let result = data.choices[0].message.content || '';
            // Si el modelo devolvió etiquetas <think>...</think>, las eliminamos
            result = result.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            // Limpiar comillas circundantes
            result = result.replace(/^["'`«“]+|["'`»”]+$/g, '').trim();
            if (result.length > 0) {
                console.log('[Groq] Frase final conjugada para TTS:', result);
                groqService.setStatus('online');
                setCache(cacheKey, result, normalizedText, {
                    lang: targetLangCode,
                    gender: gender,
                    complexity: complexity,
                    model: model,
                    userContext: userContext
                });
                groqService.addRecentPhrase(result, normalizedText);
                return result;
            }
        }
        groqService.setStatus('fallback');
        groqService.addRecentPhrase(normalizedText, text);
        return normalizedText;
    } catch (e) {
        clearTimeout(timeoutId);
        console.warn('[Groq] Fallback activado (error/timeout <2.5s), devolviendo texto original limpio:', e);
        groqService.setStatus('fallback');
        groqService.addRecentPhrase(normalizedText, text);
        return normalizedText;
    }
};

// Sincronización automática de frases con la base de datos y la nube del servidor por usuario
function onUserOrDatabaseSwitched() {
    memoryCache = null;
    memoryCacheUser = null;
    groqService.syncFromDatabase();
    try {
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED);
    } catch (e) {}
}

$(document).on(constants.EVENT_DB_INITIALIZED, onUserOrDatabaseSwitched);
$(document).on(constants.EVENT_USER_CHANGED, onUserOrDatabaseSwitched);
$(document).on(constants.EVENT_DB_PULL_UPDATED, () => {
    groqService.syncFromDatabase();
});
$(document).on(constants.EVENT_DB_INITIAL_SYNC_COMPLETE, () => {
    groqService.syncFromDatabase();
});
$(document).on(constants.EVENT_DB_DATAMODEL_UPDATE, onUserOrDatabaseSwitched);

export { groqService };
