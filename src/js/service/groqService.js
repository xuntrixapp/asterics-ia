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

// --- HISTORIAL DE FRASES RECIENTES ---
const RECENT_STORAGE_KEY = 'asterics_groq_recent';
const MAX_RECENT_PHRASES = 10;

groqService.getRecentPhrases = function() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            let data = window.localStorage.getItem(RECENT_STORAGE_KEY);
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
        // Si ya está primera, no duplicar
        if (list.length > 0 && list[0].text.toLowerCase() === cleanSpoken.toLowerCase()) {
            return;
        }
        // Quitar duplicados previos
        list = list.filter(item => item.text.toLowerCase() !== cleanSpoken.toLowerCase());
        list.unshift({
            text: cleanSpoken,
            rawText: rawText || '',
            timestamp: Date.now()
        });
        if (list.length > MAX_RECENT_PHRASES) {
            list = list.slice(0, MAX_RECENT_PHRASES);
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list));
        }
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED, [list]);
    } catch (e) {}
};

groqService.clearRecentPhrases = function() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(RECENT_STORAGE_KEY);
        }
        $(document).trigger(constants.EVENT_GROQ_RECENT_UPDATED, [[]]);
    } catch (e) {}
};

// --- CACHÉ LOCAL PERSISTENTE (Latencia 0ms, 0 tokens, soporte offline) ---
const CACHE_STORAGE_KEY = 'asterics_groq_cache_v3';
const MAX_CACHE_ENTRIES = 5000; // Ampliado a 5.000 frases para cobertura exhaustiva a largo plazo
let memoryCache = null;

function getCache() {
    if (!memoryCache) {
        memoryCache = new Map();
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                let stored = window.localStorage.getItem(CACHE_STORAGE_KEY);
                if (stored) {
                    let parsed = JSON.parse(stored);
                    Object.keys(parsed).forEach(k => {
                        let item = parsed[k];
                        if (typeof item === 'string') {
                            memoryCache.set(k, { sentence: item, rawText: '', timestamp: Date.now() });
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

function setCache(key, value, rawText) {
    try {
        let cache = getCache();
        const entry = {
            sentence: typeof value === 'string' ? value : ((value && value.sentence) || ''),
            rawText: rawText || (typeof value === 'object' && value ? value.rawText : '') || '',
            timestamp: Date.now()
        };
        cache.set(key, entry);
        if (cache.size > MAX_CACHE_ENTRIES) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            let obj = {};
            cache.forEach((v, k) => { obj[k] = v; });
            window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
        }
    } catch (e) {}
}

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
    const cache = getCache();
    const cleanSentence = (newSentence || '').trim();
    if (!cleanSentence) return false;

    let existing = cache.get(key) || {};
    let raw = newRawText !== undefined ? newRawText.trim() : (existing.rawText || '');
    cache.set(key, {
        sentence: cleanSentence,
        rawText: raw,
        timestamp: Date.now()
    });
    if (typeof window !== 'undefined' && window.localStorage) {
        let obj = {};
        cache.forEach((v, k) => { obj[k] = v; });
        window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    }
    return true;
};

groqService.deleteDictionaryEntry = function(key) {
    if (!key) return false;
    const cache = getCache();
    const deleted = cache.delete(key);
    if (deleted && typeof window !== 'undefined' && window.localStorage) {
        let obj = {};
        cache.forEach((v, k) => { obj[k] = v; });
        window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    }
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

    setCache(key, cleanSentence, cleanRaw);
    return true;
};

groqService.clearDictionary = function() {
    const cache = getCache();
    cache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(CACHE_STORAGE_KEY);
    }
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
                setCache(cacheKey, result, normalizedText);
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

export { groqService };
