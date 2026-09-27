import { constants } from '../util/constants.js';
import { localStorageService } from './data/localStorageService.js';
import { i18nService } from './i18nService.js';
import $ from '../externals/jquery.js';

let kokoroService = {};

// Catálogo estructurado de voces Kokoro-82M con metadatos
const KOKORO_VOICES = [
    // Español (es)
    { id: 'es_paloma', name: 'Paloma (Español - Mujer)', lang: 'es', langFull: 'es-ES', gender: 'female', isDefault: true },
    { id: 'es_alonso', name: 'Alonso (Español - Hombre)', lang: 'es', langFull: 'es-ES', gender: 'male' },

    // English US (en-us)
    { id: 'af_heart', name: 'Heart (US - Female, Alta Calidad)', lang: 'en', langFull: 'en-US', gender: 'female', isDefault: true },
    { id: 'af_bella', name: 'Bella (US - Female)', lang: 'en', langFull: 'en-US', gender: 'female' },
    { id: 'af_nicole', name: 'Nicole (US - Female)', lang: 'en', langFull: 'en-US', gender: 'female' },
    { id: 'af_aoede', name: 'Aoede (US - Female)', lang: 'en', langFull: 'en-US', gender: 'female' },
    { id: 'af_kore', name: 'Kore (US - Female)', lang: 'en', langFull: 'en-US', gender: 'female' },
    { id: 'af_sarah', name: 'Sarah (US - Female)', lang: 'en', langFull: 'en-US', gender: 'female' },
    { id: 'af_sky', name: 'Sky (US - Female)', lang: 'en', langFull: 'en-US', gender: 'female' },
    { id: 'am_adam', name: 'Adam (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_echo', name: 'Echo (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_eric', name: 'Eric (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_fenrir', name: 'Fenrir (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_liam', name: 'Liam (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_michael', name: 'Michael (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_onyx', name: 'Onyx (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },
    { id: 'am_puck', name: 'Puck (US - Male)', lang: 'en', langFull: 'en-US', gender: 'male' },

    // English UK (en-gb)
    { id: 'bf_alice', name: 'Alice (UK - Female)', lang: 'en', langFull: 'en-GB', gender: 'female' },
    { id: 'bf_emma', name: 'Emma (UK - Female)', lang: 'en', langFull: 'en-GB', gender: 'female' },
    { id: 'bf_isabella', name: 'Isabella (UK - Female)', lang: 'en', langFull: 'en-GB', gender: 'female' },
    { id: 'bf_lily', name: 'Lily (UK - Female)', lang: 'en', langFull: 'en-GB', gender: 'female' },
    { id: 'bm_daniel', name: 'Daniel (UK - Male)', lang: 'en', langFull: 'en-GB', gender: 'male' },
    { id: 'bm_fable', name: 'Fable (UK - Male)', lang: 'en', langFull: 'en-GB', gender: 'male' },
    { id: 'bm_george', name: 'George (UK - Male)', lang: 'en', langFull: 'en-GB', gender: 'male' },
    { id: 'bm_lewis', name: 'Lewis (UK - Male)', lang: 'en', langFull: 'en-GB', gender: 'male' },

    // Français (fr)
    { id: 'ff_siwis', name: 'Siwis (Français - Femme)', lang: 'fr', langFull: 'fr-FR', gender: 'female', isDefault: true },

    // Italiano (it)
    { id: 'if_sara', name: 'Sara (Italiano - Donna)', lang: 'it', langFull: 'it-IT', gender: 'female', isDefault: true },
    { id: 'im_nicola', name: 'Nicola (Italiano - Uomo)', lang: 'it', langFull: 'it-IT', gender: 'male' },

    // Português (pt-br)
    { id: 'pf_dora', name: 'Dora (Português - Mulher)', lang: 'pt', langFull: 'pt-BR', gender: 'female', isDefault: true },
    { id: 'pm_alex', name: 'Alex (Português - Homem)', lang: 'pt', langFull: 'pt-BR', gender: 'male' },
    { id: 'pm_santa', name: 'Santa (Português - Homem)', lang: 'pt', langFull: 'pt-BR', gender: 'male' },

    // 日本語 Japanese (ja)
    { id: 'jf_alpha', name: 'Alpha (日本語 - 女性)', lang: 'ja', langFull: 'ja-JP', gender: 'female', isDefault: true },
    { id: 'jf_gongitsune', name: 'Gongitsune (日本語 - 女性)', lang: 'ja', langFull: 'ja-JP', gender: 'female' },
    { id: 'jf_nezumi', name: 'Nezumi (日本語 - 女性)', lang: 'ja', langFull: 'ja-JP', gender: 'female' },
    { id: 'jf_tebukuro', name: 'Tebukuro (日本語 - 女性)', lang: 'ja', langFull: 'ja-JP', gender: 'female' },
    { id: 'jm_kento', name: 'Kento (日本語 - 男性)', lang: 'ja', langFull: 'ja-JP', gender: 'male' },

    // 中文 Chinese (zh)
    { id: 'zf_xiaobei', name: 'Xiaobei (中文 - 女性)', lang: 'zh', langFull: 'zh-CN', gender: 'female', isDefault: true },
    { id: 'zf_xiaoni', name: 'Xiaoni (中文 - 女性)', lang: 'zh', langFull: 'zh-CN', gender: 'female' },
    { id: 'zf_xiaoxiao', name: 'Xiaoxiao (中文 - 女性)', lang: 'zh', langFull: 'zh-CN', gender: 'female' },
    { id: 'zf_xiaoyi', name: 'Xiaoyi (中文 - 女性)', lang: 'zh', langFull: 'zh-CN', gender: 'female' },
    { id: 'zm_yunjian', name: 'Yunjian (中文 - 男性)', lang: 'zh', langFull: 'zh-CN', gender: 'male' },
    { id: 'zm_yunxi', name: 'Yunxi (中文 - 男性)', lang: 'zh', langFull: 'zh-CN', gender: 'male' },
    { id: 'zm_yunxia', name: 'Yunxia (中文 - 男性)', lang: 'zh', langFull: 'zh-CN', gender: 'male' },
    { id: 'zm_yunyang', name: 'Yunyang (中文 - 男性)', lang: 'zh', langFull: 'zh-CN', gender: 'male' },

    // हिन्दी Hindi (hi)
    { id: 'hf_alpha', name: 'Alpha (हिन्दी - महिला)', lang: 'hi', langFull: 'hi-IN', gender: 'female', isDefault: true },
    { id: 'hf_beta', name: 'Beta (हिन्दी - महिला)', lang: 'hi', langFull: 'hi-IN', gender: 'female' },
    { id: 'hm_omega', name: 'Omega (हिन्दी - पुरुष)', lang: 'hi', langFull: 'hi-IN', gender: 'male' },
    { id: 'hm_psi', name: 'Psi (हिन्दी - पुरुष)', lang: 'hi', langFull: 'hi-IN', gender: 'male' }
];

// Endpoint predeterminado optimizado de Kokoro TTS (OpenAI compatible / Kokoro FastAPI)
const DEFAULT_KOKORO_ENDPOINT = 'https://kokoro-tts-api.hf.space/v1';

// Estado de reproducción Web Audio
let _audioContext = null;
let _currentSourceNode = null;
let _currentGainNode = null;
let _isSpeaking = false;
let _activeAbortController = null;
let _cachingInProgress = false;

// Gestor de Base de Datos IndexedDB para Caché Persistente de Audios
const DB_NAME = 'kokoro_tts_db';
const DB_STORE = 'audio_cache';
const DB_VERSION = 1;
let _dbInstance = null;

function getDb() {
    if (_dbInstance) {
        return Promise.resolve(_dbInstance);
    }
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            return resolve(null);
        }
        let req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            let db = e.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                let store = db.createObjectStore(DB_STORE, { keyPath: 'key' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('size', 'size', { unique: false });
            }
        };
        req.onsuccess = (e) => {
            _dbInstance = e.target.result;
            resolve(_dbInstance);
        };
        req.onerror = (e) => {
            console.warn('[KokoroTTS] IndexedDB open error:', e);
            resolve(null);
        };
    });
}

function generateCacheKey(text, voiceId, rate) {
    let cleanText = (text || '').trim().toLowerCase();
    let cleanVoice = (voiceId || 'default').trim().toLowerCase();
    let cleanRate = (rate || 1.0).toFixed(2);
    return `${cleanVoice}__${cleanRate}__${cleanText}`;
}

async function getFromCache(key) {
    let db = await getDb();
    if (!db) return null;
    return new Promise((resolve) => {
        try {
            let tx = db.transaction(DB_STORE, 'readwrite');
            let store = tx.objectStore(DB_STORE);
            let req = store.get(key);
            req.onsuccess = () => {
                let record = req.result;
                if (record && record.data) {
                    // Actualizar marca de tiempo para algoritmo LRU
                    record.timestamp = Date.now();
                    store.put(record);
                    resolve(record.data);
                } else {
                    resolve(null);
                }
            };
            req.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
}

async function saveToCache(key, text, voiceId, rate, arrayBuffer, maxQuotaMb = 500) {
    let db = await getDb();
    if (!db || !arrayBuffer) return;
    try {
        let size = arrayBuffer.byteLength || 0;
        let record = {
            key: key,
            text: text,
            voice: voiceId,
            rate: rate,
            data: arrayBuffer,
            size: size,
            timestamp: Date.now()
        };
        let tx = db.transaction(DB_STORE, 'readwrite');
        let store = tx.objectStore(DB_STORE);
        store.put(record);
        tx.oncomplete = () => {
            $(document).trigger(constants.EVENT_KOKORO_CACHE_UPDATED);
            // Comprobación y purga LRU si excede la cuota máxima
            pruneCacheIfNeeded(maxQuotaMb);
        };
    } catch (e) {
        console.warn('[KokoroTTS] Error saving to cache:', e);
    }
}

async function pruneCacheIfNeeded(maxQuotaMb = 500) {
    let db = await getDb();
    if (!db) return;
    try {
        let tx = db.transaction(DB_STORE, 'readonly');
        let store = tx.objectStore(DB_STORE);
        let req = store.getAll();
        req.onsuccess = async () => {
            let records = req.result || [];
            let totalBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);
            let maxBytes = maxQuotaMb * 1024 * 1024;

            if (totalBytes > maxBytes && records.length > 0) {
                // Ordenar de más antiguo a más nuevo (LRU)
                records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                let deleteTx = db.transaction(DB_STORE, 'readwrite');
                let deleteStore = deleteTx.objectStore(DB_STORE);
                let bytesToDelete = totalBytes - (maxBytes * 0.85); // Purgar hasta dejar 15% de margen
                let deletedBytes = 0;

                for (let rec of records) {
                    if (deletedBytes >= bytesToDelete) break;
                    deleteStore.delete(rec.key);
                    deletedBytes += (rec.size || 0);
                }
                deleteTx.oncomplete = () => {
                    $(document).trigger(constants.EVENT_KOKORO_CACHE_UPDATED);
                };
            }
        };
    } catch (e) {}
}

// Inicialización de Web Audio Context reutilizable
function getAudioContext() {
    if (!_audioContext || _audioContext.state === 'closed') {
        let AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            _audioContext = new AudioCtx();
        }
    }
    if (_audioContext && _audioContext.state === 'suspended') {
        _audioContext.resume().catch(() => {});
    }
    return _audioContext;
}

/**
 * Retorna todas las voces de Kokoro disponibles, opcionalmente filtradas por idioma base
 */
kokoroService.getVoices = function (langFilter) {
    if (!langFilter) {
        return [...KOKORO_VOICES];
    }
    let baseLang = i18nService.getBaseLang(langFilter).toLowerCase();
    let filtered = KOKORO_VOICES.filter((v) => v.lang === baseLang || v.langFull.toLowerCase().startsWith(baseLang));
    return filtered.length > 0 ? filtered : [...KOKORO_VOICES];
};

/**
 * Retorna la voz por defecto para un idioma específico
 */
kokoroService.getDefaultVoiceForLang = function (lang) {
    let baseLang = (lang ? i18nService.getBaseLang(lang) : i18nService.getContentLangBase()).toLowerCase();
    let voice = KOKORO_VOICES.find((v) => v.lang === baseLang && v.isDefault) ||
                KOKORO_VOICES.find((v) => v.lang === baseLang);
    return voice ? voice.id : 'es_paloma';
};

/**
 * Retorna metadatos de una voz por su ID
 */
kokoroService.getVoiceById = function (voiceId) {
    return KOKORO_VOICES.find((v) => v.id === voiceId) || null;
};

/**
 * Retorna estadísticas de almacenamiento en caché en MB
 */
kokoroService.getCacheStats = async function () {
    let db = await getDb();
    if (!db) return { count: 0, sizeBytes: 0, sizeMb: '0.00', maxMb: 500 };
    return new Promise((resolve) => {
        try {
            let tx = db.transaction(DB_STORE, 'readonly');
            let store = tx.objectStore(DB_STORE);
            let req = store.getAll();
            req.onsuccess = () => {
                let records = req.result || [];
                let totalBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);
                let userSettings = localStorageService.getUserSettings();
                let maxMb = (userSettings && userSettings.voiceConfig && userSettings.voiceConfig.kokoroCacheLimitMb) || 500;
                resolve({
                    count: records.length,
                    sizeBytes: totalBytes,
                    sizeMb: (totalBytes / (1024 * 1024)).toFixed(2),
                    maxMb: maxMb
                });
            };
            req.onerror = () => resolve({ count: 0, sizeBytes: 0, sizeMb: '0.00', maxMb: 500 });
        } catch (e) {
            resolve({ count: 0, sizeBytes: 0, sizeMb: '0.00', maxMb: 500 });
        }
    });
};

/**
 * Vacía completamente la caché de audios Kokoro
 */
kokoroService.clearCache = async function () {
    let db = await getDb();
    if (!db) return;
    return new Promise((resolve) => {
        try {
            let tx = db.transaction(DB_STORE, 'readwrite');
            let store = tx.objectStore(DB_STORE);
            let req = store.clear();
            req.onsuccess = () => {
                $(document).trigger(constants.EVENT_KOKORO_CACHE_UPDATED);
                resolve(true);
            };
            req.onerror = () => resolve(false);
        } catch (e) {
            resolve(false);
        }
    });
};

/**
 * Detiene la reproducción activa de Kokoro TTS
 */
kokoroService.stop = function () {
    if (_activeAbortController) {
        _activeAbortController.abort();
        _activeAbortController = null;
    }
    if (_currentSourceNode) {
        try {
            _currentSourceNode.stop();
        } catch (e) {}
        _currentSourceNode = null;
    }
    _isSpeaking = false;
};

/**
 * Indica si Kokoro TTS está reproduciendo activamente
 */
kokoroService.isSpeaking = function () {
    return _isSpeaking;
};

/**
 * Sintetiza y reproduce audio con Kokoro TTS
 */
kokoroService.speak = async function (text, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
        return;
    }
    text = text.trim();

    let userSettings = localStorageService.getUserSettings();
    let voiceConfig = userSettings.voiceConfig || {};
    let systemVolume = userSettings.systemVolume !== undefined ? userSettings.systemVolume : 100;
    if (systemVolume === 0 || userSettings.systemVolumeMuted) {
        return;
    }

    // Detener reproducción anterior a menos que dontStop esté activo
    if (!options.dontStop) {
        kokoroService.stop();
    }

    // Determinar voz adecuada
    let targetLang = options.lang || (options.voiceLangIsTextLang ? i18nService.getContentLang() : i18nService.getContentLangBase());
    let voiceId = options.preferredVoice || voiceConfig.kokoroVoice || kokoroService.getDefaultVoiceForLang(targetLang);

    // Ajustes avanzados
    let rate = options.rate || (options.useStandardRatePitch ? 1.0 : (voiceConfig.voiceRate || 1.0));
    let pitch = options.useStandardRatePitch ? 1.0 : (voiceConfig.voicePitch || 1.0);
    let maxQuotaMb = voiceConfig.kokoroCacheLimitMb || 500;
    let serverUrl = (voiceConfig.kokoroServerUrl || '').trim() || DEFAULT_KOKORO_ENDPOINT;

    // Clave de caché para almacenamiento persistente
    let cacheKey = generateCacheKey(text, voiceId, rate);
    let audioBuffer = null;

    // 1. Intentar obtener de la caché local persistente (0 ms de latencia)
    let cachedData = await getFromCache(cacheKey);

    if (cachedData) {
        audioBuffer = cachedData;
    } else {
        // 2. Si no está en caché, solicitar al endpoint Kokoro
        try {
            _activeAbortController = new AbortController();
            let endpoint = `${serverUrl.replace(/\/+$/, '')}/audio/speech`;
            let payload = {
                model: 'kokoro',
                input: text,
                voice: voiceId,
                speed: rate,
                response_format: 'mp3'
            };

            let response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: _activeAbortController.signal
            });

            if (!response.ok) {
                throw new Error(`Kokoro HTTP error: ${response.status}`);
            }

            let blob = await response.blob();
            audioBuffer = await blob.arrayBuffer();

            // Guardar en la caché local permanente
            if (audioBuffer && audioBuffer.byteLength > 0) {
                saveToCache(cacheKey, text, voiceId, rate, audioBuffer, maxQuotaMb);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }
            console.warn('[KokoroTTS] API request failed, falling back:', err);
            // Fallback: Si no hay red y no está en caché, permitir síntesis de emergencia
            if (window.speechSynthesis) {
                let utter = new SpeechSynthesisUtterance(text);
                utter.rate = rate;
                utter.pitch = pitch;
                utter.volume = systemVolume / 100.0;
                window.speechSynthesis.speak(utter);
            }
            return;
        } finally {
            _activeAbortController = null;
        }
    }

    // 3. Reproducción mediante Web Audio API
    if (!audioBuffer || audioBuffer.byteLength === 0) {
        return;
    }

    let ctx = getAudioContext();
    if (!ctx) return;

    return new Promise((resolve) => {
        ctx.decodeAudioData(audioBuffer.slice(0), (decoded) => {
            try {
                kokoroService.stop();

                let source = ctx.createBufferSource();
                let gainNode = ctx.createGain();

                source.buffer = decoded;

                // Aplicar volumen del sistema
                gainNode.gain.value = Math.max(0, Math.min(1, systemVolume / 100.0));

                // Aplicar tono (Pitch detune en cents: 1.0 = 0 cents, 1.2 = +300 cents)
                if (pitch && pitch !== 1.0 && source.detune) {
                    source.detune.value = Math.round((pitch - 1.0) * 1200);
                }

                source.connect(gainNode);
                gainNode.connect(ctx.destination);

                _currentSourceNode = source;
                _currentGainNode = gainNode;
                _isSpeaking = true;

                source.onended = () => {
                    _isSpeaking = false;
                    _currentSourceNode = null;
                    if (options.progressFn) {
                        options.progressFn();
                    }
                    resolve();
                };

                source.start(0);
            } catch (playErr) {
                _isSpeaking = false;
                resolve();
            }
        }, (decodeErr) => {
            console.warn('[KokoroTTS] Decode error:', decodeErr);
            _isSpeaking = false;
            resolve();
        });
    });
};

/**
 * Pre-descarga y almacena en caché el vocabulario completo de un tablero
 */
kokoroService.cacheGridElements = async function (gridElements, progressCallback) {
    if (_cachingInProgress || !gridElements || !gridElements.length) {
        return;
    }
    _cachingInProgress = true;
    let userSettings = localStorageService.getUserSettings();
    let voiceConfig = userSettings.voiceConfig || {};
    let currentLang = i18nService.getContentLang();
    let voiceId = voiceConfig.kokoroVoice || kokoroService.getDefaultVoiceForLang(currentLang);
    let rate = voiceConfig.voiceRate || 1.0;
    let maxQuotaMb = voiceConfig.kokoroCacheLimitMb || 500;
    let serverUrl = (voiceConfig.kokoroServerUrl || '').trim() || DEFAULT_KOKORO_ENDPOINT;

    let phrasesToCache = new Set();

    for (let el of gridElements) {
        if (!el) continue;
        let label = el.label ? i18nService.getTranslation(el.label) : '';
        if (label && typeof label === 'string' && label.trim()) {
            phrasesToCache.add(label.trim());
        }
        if (el.actions && el.actions.length) {
            for (let action of el.actions) {
                if (action.speakText) {
                    let sp = i18nService.getTranslation(action.speakText);
                    if (sp && typeof sp === 'string' && sp.trim()) {
                        phrasesToCache.add(sp.trim());
                    }
                }
            }
        }
    }

    let phrases = Array.from(phrasesToCache);
    let total = phrases.length;
    let completed = 0;

    for (let phrase of phrases) {
        let cacheKey = generateCacheKey(phrase, voiceId, rate);
        let existing = await getFromCache(cacheKey);
        if (!existing) {
            try {
                let endpoint = `${serverUrl.replace(/\/+$/, '')}/audio/speech`;
                let payload = {
                    model: 'kokoro',
                    input: phrase,
                    voice: voiceId,
                    speed: rate,
                    response_format: 'mp3'
                };
                let response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    let blob = await response.blob();
                    let buf = await blob.arrayBuffer();
                    if (buf && buf.byteLength > 0) {
                        await saveToCache(cacheKey, phrase, voiceId, rate, buf, maxQuotaMb);
                    }
                }
            } catch (e) {}
        }
        completed++;
        if (progressCallback) {
            progressCallback(Math.round((completed / total) * 100));
        }
    }

    _cachingInProgress = false;
    $(document).trigger(constants.EVENT_KOKORO_CACHE_UPDATED);
};

export { kokoroService, KOKORO_VOICES, DEFAULT_KOKORO_ENDPOINT };
