import $ from '../externals/jquery.js';
import VueI18n from 'vue-i18n';
import { localStorageService } from './data/localStorageService.js';
import { constants } from '../util/constants';

let i18nService = {};

let PREDEFINED_TRANSLATION_BASE_URL = constants.BOARDS_REPO_BASE_URL + "predefined_mappings/i18n/";

let vueI18n = null;
let loadedLanguages = [];
let fallbackLang = 'en';
let currentContentLang = null;
let currentAppLang = localStorageService.getAppSettings().appLang;
let predefActionsI18nData = {};

let appLanguages = [
    'en',
    'de',
    'ar',
    'eu',
    'bg',
    'ca',
    'hr',
    'cs',
    'nl',
    'fr',
    'gl',
    'he',
    'hu',
    'it',
    'ko',
    'pl',
    'pt',
    'ro',
    'ru',
    'sl',
    'es',
    'tr',
    'uk',
    'val'
];
//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLangCodes = ["aa","ab","ae","af","ak","am","an","ar","ar-ae","ar-bh","ar-dz","ar-eg","ar-iq","ar-jo","ar-kw","ar-lb","ar-ly","ar-ma","ar-om","ar-qa","ar-sa","ar-sy","ar-tn","ar-ye","as","av","ay","az","ba","be","bg","bh","bi","bm","bn","bo","br","bs","ca","ce","ch","co","cr","cs","cu","cv","cy","da","de","de-at","de-ch","de-ch-loc","de-li","de-lu","dv","dz","ee","el","en","en-au","en-bz","en-ca","en-gb","en-ie","en-in","en-jm","en-nz","en-tt","en-us","en-za","eo","es","es-ar","es-bo","es-cl","es-co","es-cr","es-do","es-ec","es-gt","es-hn","es-mx","es-ni","es-pa","es-pe","es-pr","es-py","es-sv","es-uy","es-ve","et","eu","fa","ff","fi","fj","fo","fr","fr-be","fr-ca","fr-ch","fr-lu","fy","ga","gd","gl","gn","gu","gv","ha","he","hi","ho","hr","ht","hu","hy","hz","ia","id","ie","ig","ii","ik","io","is","it","it-ch","iu","ja","ji","jv","ka","kg","ki","kj","kk","kl","km","kn","ko","kr","ks","ku","kv","kw","ky","la","lb","lg","li","ln","lo","lt","lu","lv","mg","mh","mi","mk","ml","mn","mr","ms","mt","my","na","nb","nd","ne","ng","nl","nl-be","nn","no","nr","nv","ny","oc","oj","om","or","os","pa","pi","pl","ps","pt","pt-br","qu","rm","rn","ro","ro-md","ru","ru-md","rw","sa","sb","sc","sd","se","sg","si","sk","sl","sm","sn","so","sq","sr","ss","st","su","sv","sv-fi","sw","ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty","ug","uk","ur","uz","val","ve","vi","vo","wa","wo","xh","yi","yo","za","zh","zh-cn","zh-hk","zh-sg","zh-tw","zu"];
let allLanguages = allLangCodes.map((code) => {
    return { code };
}); // dynamically filled array containing data like [{en: "English", de: "Englisch", code: "en"}, ...] of all languages, always sorted by translation of current language

i18nService.getVueI18n = async function () {
    if (vueI18n) {
        return vueI18n;
    }
    vueI18n = new VueI18n({
        locale: i18nService.getAppLang(), // set locale
        fallbackLocale: fallbackLang,
        messages: {}
    });
    await loadLanguage(fallbackLang);
    await getPredefinedActionTranslations(fallbackLang);
    await getPredefinedActionTranslations();
    applyGroqTranslations(fallbackLang);
    getUserSettings();
    return i18nService.setAppLanguage(i18nService.getAppLang(), true, true).then(() => {
        applyGroqTranslations(i18nService.getAppLang());
        return Promise.resolve(vueI18n);
    });
};

i18nService.getBrowserLang = function () {
    return navigator.language.substring(0, 2).toLowerCase();
};

i18nService.getContentLang = function () {
    return currentContentLang || i18nService.getAppLang();
};

/**
 * returns the current content language, but without country code, e.g. "de" if content lang is "de-at"
 * @return {string|*}
 */
i18nService.getContentLangBase = function () {
    return i18nService.getBaseLang(i18nService.getContentLang());
};

i18nService.getContentLangReadable = function () {
    return i18nService.getLangReadable(i18nService.getContentLang());
};

i18nService.getAppLang = function () {
    return i18nService.getCustomAppLang() || i18nService.getBrowserLang();
};

i18nService.getCustomAppLang = function () {
    return currentAppLang || '';
};

i18nService.isCurrentAppLangDE = function () {
    return i18nService.getAppLang() === 'de';
};

i18nService.isCurrentAppLangEN = function () {
    return i18nService.getAppLang() === 'en';
};

i18nService.isCurrentContentLangEN = function() {
    return i18nService.getContentLangBase() === 'en';
}

/**
 * sets the language code to use (ISO 639-1)
 * @param lang two-letter language code to use
 * @param dontSave if true, passed lang is not saved to local storage
 */
i18nService.setAppLanguage = async function (lang, dontSave, force) {
    if (currentAppLang === lang && !force) {
        return;
    }
    if (!dontSave) {
        localStorageService.saveAppSettings({appLang: lang});
    }
    currentAppLang = lang || i18nService.getBrowserLang();
    $('html').prop('lang', currentAppLang);
    await getPredefinedActionTranslations();
    return loadLanguage(currentAppLang).then(() => {
        vueI18n.locale = currentAppLang;
        allLanguages.sort((a, b) => a[currentAppLang].toLowerCase().localeCompare(b[currentAppLang].toLowerCase()));
        return Promise.resolve();
    });
};

i18nService.setContentLanguage = async function (lang, dontSave) {
    let lastContentLang = currentContentLang;
    currentContentLang = lang || undefined;
    if (!dontSave) {
        localStorageService.saveUserSettings({contentLang: currentContentLang, lastContentLang: lastContentLang})
    }
    return loadLanguage(i18nService.getContentLangBase()); // use promise for return!
};

/**
 * retrieves array of all languages, ordered by translation of current user language
 * @return {any} array in format [{de: "Deutsch", en: "German", code: "de"}, ...]
 */
i18nService.getAllLanguages = function () {
    return JSON.parse(JSON.stringify(allLanguages));
};

i18nService.getAllLangCodes = function() {
    return i18nService.getAllLanguages().map(lang => lang.code);
}

/**
 * retrieves existing app languages translated via crowdin.com
 * @return {any}
 */
i18nService.getAppLanguages = function () {
    return JSON.parse(JSON.stringify(appLanguages));
};

/**
 * gets translation of the given language (e.g. "English")
 * @param lang language code, either only 2 digits (e.g. "en") or localized (e.g. "en-us")
 * @returns {*}
 */
i18nService.getLangReadable = function (lang) {
    let baseLang = i18nService.getBaseLang(lang);
    let langObject = allLanguages.find(object => object.code === lang);
    let baselangObject = allLanguages.find(object => object.code === baseLang) || {};

    return langObject ? langObject[i18nService.getAppLang()] : baselangObject[i18nService.getAppLang()];
};

/**
 * get app translation for the given key in the current app language
 * @param key
 * @param args optional arguments for placeholders within the translation
 * @return {*}
 */
i18nService.t = function (key, ...args) {
    if (!key) {
        return '';
    }
    return vueI18n.t(key, i18nService.getAppLang(), args);
};

/**
 * checks if translation exists
 * @param key
 * @return true, if translations exists
 */
i18nService.te = function (key) {
    return vueI18n.te(key, i18nService.getAppLang());
}

/**
 * returns the translation of the first existing given translation key. If no translation is existing, the last
 * key is returned.
 * @param keys
 * @returns {*|string}
 */
i18nService.tFallback = function(...keys) {
    for (let key of keys) {
        if (i18nService.te(key)) {
            return i18nService.t(key);
        }
    }
    return keys.length > 0 ? keys[keys.length - 1] : '';
};

/**
 * get app translation for the given key in the given language
 * @param key
 * @param args optional arguments for placeholders within the translation
 * @param lang target language
 * @return {*}
 */
i18nService.tl = function (key, args, lang) {
    return vueI18n.t(key, lang, args);
};

/**
 * translates a key, but loads current language before translating
 * @param key
 * @returns {Promise<*>}
 */
i18nService.tLoad = async function(key) {
    await loadLanguage(i18nService.getAppLang());
    return i18nService.t(key);
};

/**
 * gets translation for predefined actions / requests
 * @param key
 * @returns {*}
 */
i18nService.tPredefined = function(key) {
    let translations = predefActionsI18nData[i18nService.getAppLang()] || {};
    let fallbackTranslations = predefActionsI18nData[fallbackLang] || {};
    return translations[key] ? translations[key] : (fallbackTranslations[key] ? fallbackTranslations[key] : key);
}

/**
 * get plain translation string from an translation object
 * @param i18nObject translation object, e.g. {en: 'english text', de: 'deutscher Text'}
 * @param options
 * @param options.fallbackLang language to use if current browser language not available, default: 'en'
 * @param options.includeLang if true return format is {lang: <languageCode>, text: <translatedText>}
 * @param options.lang language in which the translation is forced to be returned (if available), no exact matching, so "en-us" also matches for "en"
 * @param options.forceLang exact language in which the translation is forced to be returned (if available), exact matching, so "en-us" doesn't match for "en"
 * @param options.noFallback if true nothing is returned if the current content lang / force lang isn't existing in the
 *                           translation object
 * @return {string|*|string} the translated string in current browser language, e.g. 'english text'
 */
i18nService.getTranslation = function (i18nObject, options = {}) {
    if (!i18nObject) {
        return '';
    }
    options.lang = options.lang || '';
    let lang = options.forceLang || options.lang || i18nService.getContentLang();
    let baseLang = options.forceLang || i18nService.getBaseLang(options.lang) || i18nService.getContentLangBase();
    options.fallbackLang = options.fallbackLang || 'en';
    if (typeof i18nObject === 'string') {
        return i18nService.t(i18nObject);
    }
    if (i18nObject[lang]) {
        return !options.includeLang ? i18nObject[lang] : { lang: lang, text: i18nObject[lang] };
    }
    if (i18nObject[baseLang]) {
        return !options.includeLang ? i18nObject[baseLang] : {
            lang: baseLang,
            text: i18nObject[baseLang]
        };
    }

    if (!options.noFallback) {
        if (i18nObject[options.fallbackLang]) {
            return !options.includeLang
                ? `${i18nObject[options.fallbackLang]}`
                : { lang: options.fallbackLang, text: `${i18nObject[options.fallbackLang]}` };
        }

        let keys = Object.keys(i18nObject);
        for (let key of keys) {
            if (i18nObject[key]) {
                return !options.includeLang ? `${i18nObject[key]}` : { lang: key, text: `${i18nObject[key]}` };
            }
        }
    }

    return !options.includeLang ? '' : { lang: undefined, text: '' };
};

i18nService.getTranslationAppLang = function (i18nObject) {
    return i18nService.getTranslation(i18nObject, { forceLang: i18nService.getAppLang() });
};

/**
 * turns a given label to a translation object
 * @param label plain string label
 * @param locale locale of the string (2 chars, ISO 639-1)
 * @return translation object, e.g. {en: 'given label'}
 */
i18nService.getTranslationObject = function (label, locale) {
    locale = locale || i18nService.getContentLang();
    let object = {};
    object[locale] = label;
    return object;
};

/**
 * returns the base lang code of a localized language code including a country code.
 * e.g. for "en-us" the base lang is "en"
 *
 * @param langCode
 * @returns {string|*}
 */
i18nService.getBaseLang = function(langCode = '') {
    // not using simple substring(0,2) because there is also "val" (Valencian) as base lang
    let delimiterIndex = langCode.search(/[^A-Za-z]/); // index of first non-alphabetic character (= delimiter, "dash" in most cases)
    return delimiterIndex !== -1 ? langCode.substring(0, delimiterIndex) : langCode;
}

/**
 * get country code from a language code
 * e.g. "en-us" => country code is "us"
 *
 * @param langCode
 * @returns {string|*}
 */
i18nService.getCountryCode = function(langCode) {
    let delimiterIndex = langCode.search(/[^A-Za-z]/); // index of first non-alphabetic character (= delimiter, "dash" in most cases)
    return delimiterIndex !== -1 ? langCode.substring(delimiterIndex + 1) : '';
};

async function loadLanguage(useLang, secondTry) {
    if (!useLang || loadedLanguages.includes(useLang)) {
        return;
    }
    let url = 'app/lang/i18n.' + useLang + '.json';
    try {
        let messages = await $.get(url);
        loadedLanguages.push(useLang);
        vueI18n.setLocaleMessage(useLang, messages);
        applyGroqTranslations(useLang);
    } catch (e) {
        if (!secondTry) {
            await loadLanguage(fallbackLang, true);
        }
        return;
    }
    allLanguages.forEach((elem) => {
        if (!elem[useLang]) {
            let langCode = i18nService.getBaseLang(elem.code);
            let countryCode = i18nService.getCountryCode(elem.code);
            elem[useLang] = i18nService.tl(`lang.${langCode}`, [], useLang);
            if (countryCode) {
                elem[useLang] = `${elem[useLang]}, ${i18nService.tl(`country.${countryCode}`, [], useLang)}`
            }
        }
    });
    let module = await import("./serviceWorkerService.js");
    module.serviceWorkerService.cacheUrl(url);
}

async function getUserSettings() {
    let userSettings = localStorageService.getUserSettings();
    currentContentLang = userSettings.contentLang;
    loadLanguage(i18nService.getContentLangBase());
}

async function getPredefinedActionTranslations(lang) {
    lang = lang || i18nService.getAppLang();
    if (predefActionsI18nData[lang]) {
        return predefActionsI18nData[lang];
    }
    let translationFileName = `i18n.${lang}.json`;
    try {
        let translationResponse = await fetch(PREDEFINED_TRANSLATION_BASE_URL + translationFileName);
        let data = await translationResponse.json();
        predefActionsI18nData[lang] = data;
        return data;
    } catch (e) {
        log.warn(`translation file ${translationFileName} not found.`);
        if (lang !== 'en') {
            log.warn(`trying "en" translation file.`);
            return getPredefinedActionTranslations('en');
        }
        return {};
    }
};

$(document).on(constants.EVENT_USER_CHANGED, getUserSettings);

const GROQ_EMBEDDED_TRANSLATIONS = {
    "es": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Activar la corrección y conjugación gramatical automática a través de la API de Groq",
        "groqApiKey": "Clave de API de Groq",
        "verifyApiKey": "Verificar API",
        "verifyingApiKey": "Verificando...",
        "groqApiKeyValid": "Clave de API válida",
        "groqApiKeyInvalid": "Clave de API inválida",
        "groqApiKeyEmpty": "Por favor introduce una clave de API",
        "groqModel": "Modelo",
        "groqGender": "Género del usuario",
        "groqGenderNeutral": "Neutro / General",
        "groqGenderMale": "Masculino / Niño",
        "groqGenderFemale": "Femenino / Niña",
        "groqComplexity": "Nivel de lenguaje",
        "groqComplexityBasic": "Infantil / Inicial (frases cortas y directas)",
        "groqComplexityIntermediate": "Escolar / Cotidiano (natural y completo)",
        "groqComplexityAdvanced": "Avanzado / Fluido",
        "groqUserContext": "Entorno y Vocabulario Familiar (Opcional)",
        "groqUserContextPlaceholder": "Ej: Nombre del usuario: Lucas. Papá: Carlos. Mamá: Ana. Hermano: Mateo. Mascota: Toby (perro). Terapeuta: Marta.",
        "groqUserContextHelp": "Proporciona nombres de familiares, mascotas o lugares habituales para que la IA los reconozca y contextualice de inmediato.",
        "groqDictionaryTitle": "Diccionario de Frases y Caché",
        "groqDictionarySummary": "{count} frases aprendidas y memorizadas en este dispositivo",
        "groqOpenDictionary": "Ver y Editar Diccionario",
        "groqDictionaryEmpty": "No hay frases en el diccionario aún. Se guardarán automáticamente al usar el botón de Play en los tableros.",
        "groqDictColPictos": "Frase de Pictogramas (Entrada)",
        "groqDictColSentence": "Frase Conjugada (Salida)",
        "groqDictSearchPlaceholder": "Buscar por pictograma o frase...",
        "groqDictAddNew": "Añadir frase personalizada",
        "groqDictSave": "Guardar",
        "groqDictConfirmDelete": "¿Deseas eliminar esta frase del diccionario?",
        "groqDictConfirmClearAll": "¿Seguro que deseas vaciar todas las frases del diccionario y la caché?",
        "groqRecentPhrases": "Frases recientes",
        "groqRecentPhrasesTitle": "Historial de frases habladas",
        "groqRecentPhrasesEmpty": "No hay frases recientes aún. Pulsa el botón de Play en un tablero para comenzar.",
        "groqStatusOnline": "Groq IA: Conectado",
        "groqStatusCache": "Groq IA: Desde caché local (0 ms)",
        "groqStatusOffline": "Groq IA: Modo sin conexión",
        "groqClearHistory": "Borrar historial",
        "groqClearHistoryConfirm": "¿Seguro que deseas borrar el historial de frases recientes?",
        "groqSpeakAgain": "Volver a escuchar",
        "noteThatActivatingGroqSendsSentences": "Tenga en cuenta que al activar esta característica todas las frases construidas serán enviadas a la API de Groq para su procesamiento y conjugación en lenguaje natural.",
        "groqDictSingleCount": "frase",
        "groqDictPluralCount": "frases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: Cómo obtener tu clave gratuita de la API de Groq IA",
        "groqTutorialSubtitle": "Sigue estos sencillos pasos para activar la inteligencia artificial en AsTeRICS-Grid de forma 100% gratuita y sin necesidad de tarjeta de crédito.",
        "groqTutorialStep1Title": "Paso 1: Accede a la consola de Groq",
        "groqTutorialStep1Desc": "Entra en la página oficial de gestión de claves de Groq Cloud pulsando en el botón inferior.",
        "groqTutorialStep2Title": "Paso 2: Inicia sesión o regístrate gratis",
        "groqTutorialStep2Desc": "Puedes iniciar sesión rápidamente con tu cuenta de Google o GitHub en un solo clic.",
        "groqTutorialStep3Title": "Paso 3: Crea tu API Key",
        "groqTutorialStep3Desc": "Haz clic en el botón 'Create API Key', dale un nombre (ej. Asterics) y pulsa en 'Submit'. Aparecerá tu clave secreta.",
        "groqTutorialStep4Title": "Paso 4: Copia y pega la clave en Asterics",
        "groqTutorialStep4Desc": "Copia la clave que empieza por 'gsk_...', vuelve a esta pantalla, pégala en el campo 'Groq API Key' y pulsa en 'Verificar clave'.",
        "groqTutorialNoticeTitle": "Totalmente Gratuito y Seguro",
        "groqTutorialNoticeDesc": "Groq ofrece un plan gratuito con miles de peticiones al día. La clave solo se guarda en la memoria de este dispositivo y nunca sale de tu control.",
        "groqTutorialOpenConsoleBtn": "Abrir consola de Groq"
    },
    "en": {
        "groq": "Groq (AI)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Activate automatic grammar correction and conjugation via Groq API",
        "groqApiKey": "Groq API Key",
        "verifyApiKey": "Verify API Key",
        "verifyingApiKey": "Verifying...",
        "groqApiKeyValid": "Valid API Key",
        "groqApiKeyInvalid": "Invalid API Key",
        "groqApiKeyEmpty": "Please enter an API key",
        "groqModel": "Model",
        "groqGender": "User gender",
        "groqGenderNeutral": "Neutral / General",
        "groqGenderMale": "Masculine / Boy",
        "groqGenderFemale": "Feminine / Girl",
        "groqComplexity": "Language level",
        "groqComplexityBasic": "Child / Beginner (short & direct phrases)",
        "groqComplexityIntermediate": "School / Everyday (natural & complete)",
        "groqComplexityAdvanced": "Advanced / Fluent",
        "groqUserContext": "Family Environment & Vocabulary (Optional)",
        "groqUserContextPlaceholder": "E.g.: User name: Lucas. Dad: Carlos. Mom: Ana. Brother: Mateo. Pet: Toby (dog). Therapist: Marta.",
        "groqUserContextHelp": "Provide names of family members, pets or places for immediate AI contextual recognition.",
        "groqDictionaryTitle": "Phrase Dictionary & Cache",
        "groqDictionarySummary": "{count} learned phrases stored locally on this device",
        "groqOpenDictionary": "View & Edit Dictionary",
        "groqDictionaryEmpty": "No phrases in the dictionary yet. Phrases are automatically saved when you press Play on any board.",
        "groqDictColPictos": "Pictogram Sequence (Input)",
        "groqDictColSentence": "Conjugated Phrase (Output)",
        "groqDictSearchPlaceholder": "Search by pictogram or phrase...",
        "groqDictAddNew": "Add custom phrase",
        "groqDictSave": "Save",
        "groqDictConfirmDelete": "Do you want to delete this phrase from the dictionary?",
        "groqDictConfirmClearAll": "Are you sure you want to clear all phrases from the dictionary and cache?",
        "groqRecentPhrases": "Recent phrases",
        "groqRecentPhrasesTitle": "Spoken phrases history",
        "groqRecentPhrasesEmpty": "No recent phrases yet. Press the Play button on a board to start generating phrases.",
        "groqStatusOnline": "Groq AI: Online",
        "groqStatusCache": "Groq AI: From local cache (0 ms)",
        "groqStatusOffline": "Groq AI: Offline mode",
        "groqClearHistory": "Clear history",
        "groqClearHistoryConfirm": "Are you sure you want to clear recent phrases history?",
        "groqSpeakAgain": "Speak again",
        "noteThatActivatingGroqSendsSentences": "Note that activating this feature results in sending all constructed sentences to Groq's API for natural language processing and conjugation.",
        "groqDictSingleCount": "phrase",
        "groqDictPluralCount": "phrases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: How to get your free Groq AI API Key",
        "groqTutorialSubtitle": "Follow these simple steps to enable artificial intelligence in AsTeRICS-Grid completely free and without requiring a credit card.",
        "groqTutorialStep1Title": "Step 1: Access Groq Console",
        "groqTutorialStep1Desc": "Go to the official Groq Cloud key management page by clicking the button below.",
        "groqTutorialStep2Title": "Step 2: Sign in or register for free",
        "groqTutorialStep2Desc": "You can quickly sign in with your Google or GitHub account in one click.",
        "groqTutorialStep3Title": "Step 3: Create your API Key",
        "groqTutorialStep3Desc": "Click on 'Create API Key', give it a name (e.g. Asterics) and click 'Submit'. Your secret key will appear.",
        "groqTutorialStep4Title": "Step 4: Copy and paste key into Asterics",
        "groqTutorialStep4Desc": "Copy the key starting with 'gsk_...', return to this screen, paste it into the 'Groq API Key' field and click 'Verify Key'.",
        "groqTutorialNoticeTitle": "100% Free and Secure",
        "groqTutorialNoticeDesc": "Groq offers a generous free tier with thousands of requests per day. The key is only stored on this device and remains in your full control.",
        "groqTutorialOpenConsoleBtn": "Open Groq Console"
    },
    "ca": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Activar la correcció i conjugació gramatical automàtica a través de la API de Groq",
        "groqApiKey": "Clau de API de Groq",
        "verifyApiKey": "Verificar API",
        "verifyingApiKey": "Verificant...",
        "groqApiKeyValid": "Clau de API vàlida",
        "groqApiKeyInvalid": "Clau de API invàlida",
        "groqApiKeyEmpty": "Si us plau, introdueix una clau de API",
        "groqModel": "Model",
        "groqGender": "Gènere de l'usuari",
        "groqGenderNeutral": "Neutre / General",
        "groqGenderMale": "Masculí / Nen",
        "groqGenderFemale": "Femení / Nena",
        "groqComplexity": "Nivell de llenguatge",
        "groqComplexityBasic": "Infantil / Inicial (frases curtes i directes)",
        "groqComplexityIntermediate": "Escolar / Quotidià (natural i complet)",
        "groqComplexityAdvanced": "Avançat / Fluid",
        "groqUserContext": "Entorn i Vocabulari Familiar (Opcional)",
        "groqUserContextPlaceholder": "Ex: Nom de l'usuari: Lucas. Pare: Carles. Mare: Anna. Germà: Mateu. Mascota: Toby (gos). Terapeuta: Marta.",
        "groqUserContextHelp": "Proporciona noms de familiars, mascotes o llocs habituals perquè la IA els reconegui i contextualitzi immediatament.",
        "groqDictionaryTitle": "Diccionari de Frases i Memòria Cau",
        "groqDictionarySummary": "{count} frases apreses i memoritzades en aquest dispositiu",
        "groqOpenDictionary": "Veure i Editar Diccionari",
        "groqDictionaryEmpty": "Encara no hi ha frases al diccionari. Es desaran automàticament en prémer Reprodueix als taulers.",
        "groqDictColPictos": "Seqüència de Pictogrames (Entrada)",
        "groqDictColSentence": "Frase Conjugada (Sortida)",
        "groqDictSearchPlaceholder": "Cercar per pictograma o frase...",
        "groqDictAddNew": "Afegir frase personalitzada",
        "groqDictSave": "Desar",
        "groqDictConfirmDelete": "Vols eliminar aquesta frase del diccionari?",
        "groqDictConfirmClearAll": "Segur que vols buidar totes les frases del diccionari i la memòria cau?",
        "groqRecentPhrases": "Frases recents",
        "groqRecentPhrasesTitle": "Historial de frases parlades",
        "groqRecentPhrasesEmpty": "Encara no hi ha frases recents. Prem el botó Reprodueix en un tauler per començar.",
        "groqStatusOnline": "Groq IA: Connectat",
        "groqStatusCache": "Groq IA: Des de memòria cau local (0 ms)",
        "groqStatusOffline": "Groq IA: Mode sense connexió",
        "groqClearHistory": "Esborrar historial",
        "groqClearHistoryConfirm": "Segur que vols esborrar l'historial de frases recents?",
        "groqSpeakAgain": "Tornar a escoltar",
        "noteThatActivatingGroqSendsSentences": "Tingueu en compte que en activar aquesta característica totes les frases construïdes seran enviades a l'API de Groq per al seu processament i conjugació en llenguatge natural.",
        "groqDictSingleCount": "frase",
        "groqDictPluralCount": "frases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: Com obtenir la teva clau gratuïta de l'API de Groq IA",
        "groqTutorialSubtitle": "Segueix aquests senzills passos per activar la intel·ligència artificial a AsTeRICS-Grid de forma 100% gratuïta.",
        "groqTutorialStep1Title": "Pas 1: Accedeix a la consola de Groq",
        "groqTutorialStep1Desc": "Entra a la pàgina oficial de gestió de claus de Groq Cloud prement el botó inferior.",
        "groqTutorialStep2Title": "Pas 2: Inicia sessió o registra't gratis",
        "groqTutorialStep2Desc": "Pots iniciar sessió ràpidament amb el teu compte de Google o GitHub en un sol clic.",
        "groqTutorialStep3Title": "Pas 3: Crea la teva API Key",
        "groqTutorialStep3Desc": "Fes clic al botó 'Create API Key', posa-li un nom (ex. Asterics) i prem 'Submit'.",
        "groqTutorialStep4Title": "Pas 4: Copia i enganxa la clau a Asterics",
        "groqTutorialStep4Desc": "Copia la clau que comença per 'gsk_...', torna a aquesta pantalla, enganxa-la al camp 'Clau de API de Groq' i prem 'Verificar API'.",
        "groqTutorialNoticeTitle": "Totalment Gratuït i Segur",
        "groqTutorialNoticeDesc": "Groq ofereix un pla gratuït amb milers de peticions diàries. La clau només es desa a la memòria d'aquest dispositiu.",
        "groqTutorialOpenConsoleBtn": "Obrir consola de Groq"
    },
    "val": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Activar la correcció i conjugació gramatical automàtica a través de la API de Groq",
        "groqApiKey": "Clau de API de Groq",
        "verifyApiKey": "Verificar API",
        "verifyingApiKey": "Verificant...",
        "groqApiKeyValid": "Clau de API vàlida",
        "groqApiKeyInvalid": "Clau de API invàlida",
        "groqApiKeyEmpty": "Si us plau, introdueix una clau de API",
        "groqModel": "Model",
        "groqGender": "Gènere de l'usuari",
        "groqGenderNeutral": "Neutre / General",
        "groqGenderMale": "Masculí / Nen",
        "groqGenderFemale": "Femení / Nena",
        "groqComplexity": "Nivell de llenguatge",
        "groqComplexityBasic": "Infantil / Inicial (frases curtes i directes)",
        "groqComplexityIntermediate": "Escolar / Quotidià (natural i complet)",
        "groqComplexityAdvanced": "Avançat / Fluid",
        "groqUserContext": "Entorn i Vocabulari Familiar (Opcional)",
        "groqUserContextPlaceholder": "Ex: Nom de l'usuari: Lucas. Pare: Carles. Mare: Anna. Germà: Mateu. Mascota: Toby (gos). Terapeuta: Marta.",
        "groqUserContextHelp": "Proporciona noms de familiars, mascotes o llocs habituals perquè la IA els reconegui i contextualitzi immediatament.",
        "groqDictionaryTitle": "Diccionari de Frases i Memòria Cau",
        "groqDictionarySummary": "{count} frases apreses i memoritzades en este dispositiu",
        "groqOpenDictionary": "Veure i Editar Diccionari",
        "groqDictionaryEmpty": "Encara no hi ha frases al diccionari. Es desaran automàticament en prémer Reprodueix als taulers.",
        "groqDictColPictos": "Seqüència de Pictogrames (Entrada)",
        "groqDictColSentence": "Frase Conjugada (Sortida)",
        "groqDictSearchPlaceholder": "Cercar per pictograma o frase...",
        "groqDictAddNew": "Afegir frase personalitzada",
        "groqDictSave": "Desar",
        "groqDictConfirmDelete": "Vols eliminar aquesta frase del diccionari?",
        "groqDictConfirmClearAll": "Segur que vols buidar totes les frases del diccionari i la memòria cau?",
        "groqRecentPhrases": "Frases recents",
        "groqRecentPhrasesTitle": "Historial de frases parlades",
        "groqRecentPhrasesEmpty": "Encara no hi ha frases recents. Prem el botó Reprodueix en un tauler per començar.",
        "groqStatusOnline": "Groq IA: Connectat",
        "groqStatusCache": "Groq IA: Des de memòria cau local (0 ms)",
        "groqStatusOffline": "Groq IA: Mode sense connexió",
        "groqClearHistory": "Esborrar historial",
        "groqClearHistoryConfirm": "Segur que vols esborrar l'historial de frases recents?",
        "groqSpeakAgain": "Tornar a escoltar",
        "noteThatActivatingGroqSendsSentences": "Tingueu en compte que en activar aquesta característica totes les frases construïdes seran enviades a l'API de Groq per al seu processament i conjugació en llenguatge natural.",
        "groqDictSingleCount": "frase",
        "groqDictPluralCount": "frases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: Com obtenir la teva clau gratuïta de l'API de Groq IA",
        "groqTutorialSubtitle": "Seguix estos senzills passos per activar la intel·ligència artificial en AsTeRICS-Grid de forma 100% gratuïta.",
        "groqTutorialStep1Title": "Pas 1: Accedeix a la consola de Groq",
        "groqTutorialStep1Desc": "Entra a la pàgina oficial de gestió de claus de Groq Cloud prement el botó inferior.",
        "groqTutorialStep2Title": "Pas 2: Inicia sessió o registra't gratis",
        "groqTutorialStep2Desc": "Pots iniciar sessió ràpidament amb el teu compte de Google o GitHub en un sol clic.",
        "groqTutorialStep3Title": "Pas 3: Crea la teva API Key",
        "groqTutorialStep3Desc": "Fes clic al botó 'Create API Key', posa-li un nom (ex. Asterics) i prem 'Submit'.",
        "groqTutorialStep4Title": "Pas 4: Copia i enganxa la clau a Asterics",
        "groqTutorialStep4Desc": "Copia la clau que comença per 'gsk_...', torna a esta pantalla, pega-la en el camp 'Clau de API de Groq' i prem 'Verificar API'.",
        "groqTutorialNoticeTitle": "Totalment Gratuït i Segur",
        "groqTutorialNoticeDesc": "Groq ofereix un pla gratuït amb milers de peticions diàries. La clau només es desa a la memòria d'aquest dispositiu.",
        "groqTutorialOpenConsoleBtn": "Obrir consola de Groq"
    },
    "gl": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Activar a corrección e conxugación gramatical automática a través da API de Groq",
        "groqApiKey": "Chave de API de Groq",
        "verifyApiKey": "Verificar API",
        "verifyingApiKey": "Verificando...",
        "groqApiKeyValid": "Chave de API válida",
        "groqApiKeyInvalid": "Chave de API inválida",
        "groqApiKeyEmpty": "Por favor introduce unha chave de API",
        "groqModel": "Modelo",
        "groqGender": "Xénero do usuario",
        "groqGenderNeutral": "Neutro / Xeral",
        "groqGenderMale": "Masculino / Neno",
        "groqGenderFemale": "Feminino / Nena",
        "groqComplexity": "Nivel de linguaxe",
        "groqComplexityBasic": "Infantil / Inicial (frases curtas e directas)",
        "groqComplexityIntermediate": "Escolar / Cotián (natural e completo)",
        "groqComplexityAdvanced": "Avanzado / Fluído",
        "groqUserContext": "Contorno e Vocabulario Familiar (Opcional)",
        "groqUserContextPlaceholder": "Ex: Nome do usuario: Lucas. Pai: Carlos. Nai: Ana. Irmán: Mateo. Mascota: Toby (can). Terapeuta: Marta.",
        "groqUserContextHelp": "Proporciona nomes de familiares, mascotas ou lugares habituais para recoñecemento inmediato pola IA.",
        "groqDictionaryTitle": "Dicionario de Frases e Caché",
        "groqDictionarySummary": "{count} frases aprendidas e memorizadas neste dispositivo",
        "groqOpenDictionary": "Ver e Editar Dicionario",
        "groqDictionaryEmpty": "Aínda non hai frases no dicionario. Gardaranse automaticamente ao premer Reproducir nos taboleiros.",
        "groqDictColPictos": "Secuencia de Pictogramas (Entrada)",
        "groqDictColSentence": "Frase Conxugada (Saída)",
        "groqDictSearchPlaceholder": "Buscar por pictograma ou frase...",
        "groqDictAddNew": "Engadir frase personalizada",
        "groqDictSave": "Gardar",
        "groqDictConfirmDelete": "Queres eliminar esta frase do dicionario?",
        "groqDictConfirmClearAll": "Seguro que queres baleirar todas as frases do dicionario e da caché?",
        "groqRecentPhrases": "Frases recentes",
        "groqRecentPhrasesTitle": "Historial de frases faladas",
        "groqRecentPhrasesEmpty": "Aínda non hai frases recentes. Preme o botón Reproducir nun taboleiro para comezar.",
        "groqStatusOnline": "Groq IA: Conectado",
        "groqStatusCache": "Groq IA: Desde caché local (0 ms)",
        "groqStatusOffline": "Groq IA: Modo sen conexión",
        "groqClearHistory": "Borrar historial",
        "groqClearHistoryConfirm": "Seguro que queres borrar o historial de frases recentes?",
        "groqSpeakAgain": "Volver escoitar",
        "noteThatActivatingGroqSendsSentences": "Teña en conta que ao activar esta característica todas as frases construídas serán enviadas á API de Groq para o seu procesamento e conxugación en linguaxe natural.",
        "groqDictSingleCount": "frase",
        "groqDictPluralCount": "frases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: Como obter a túa chave gratuíta da API de Groq IA",
        "groqTutorialSubtitle": "Segue estes sinxelos pasos para activar a intelixencia artificial en AsTeRICS-Grid de forma 100% gratuíta.",
        "groqTutorialStep1Title": "Paso 1: Accede á consola de Groq",
        "groqTutorialStep1Desc": "Entra na páxina oficial de xestión de chaves de Groq Cloud premendo no botón inferior.",
        "groqTutorialStep2Title": "Paso 2: Inicia sesión ou rexístrate gratis",
        "groqTutorialStep2Desc": "Podes iniciar sesión rapidamente coa túa conta de Google ou GitHub nun só clic.",
        "groqTutorialStep3Title": "Paso 3: Crea a túa API Key",
        "groqTutorialStep3Desc": "Fai clic no botón 'Create API Key', dalle un nome (ex. Asterics) e preme en 'Submit'.",
        "groqTutorialStep4Title": "Paso 4: Copia e pega a chave en Asterics",
        "groqTutorialStep4Desc": "Copia a chave que comeza por 'gsk_...', volve a esta pantalla, pégaa no campo 'Chave de API de Groq' e preme en 'Verificar API'.",
        "groqTutorialNoticeTitle": "Totalmente Gratuíto e Seguro",
        "groqTutorialNoticeDesc": "Groq ofrece un plan gratuíto con miles de peticións diarias. A chave só se garda na memoria deste dispositivo.",
        "groqTutorialOpenConsoleBtn": "Abrir consola de Groq"
    },
    "eu": {
        "groq": "Groq (AI)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Aktibatu gramatika-zuzenketa eta konjugazio automatikoa Groq APIaren bidez",
        "groqApiKey": "Groq API Gakoa",
        "verifyApiKey": "Egiaztatu APIa",
        "verifyingApiKey": "Egiaztatzen...",
        "groqApiKeyValid": "API Gako baliagarria",
        "groqApiKeyInvalid": "API Gako baliogabea",
        "groqApiKeyEmpty": "Mesedez, sartu API gako bat",
        "groqModel": "Eredua",
        "groqGender": "Erabiltzailearen generoa",
        "groqGenderNeutral": "Neutroa / Orokorra",
        "groqGenderMale": "Gizonezkoa / Mutila",
        "groqGenderFemale": "Emakumezkoa / Neska",
        "groqComplexity": "Hizkuntza maila",
        "groqComplexityBasic": "Haurra / Hasierakoa (esaldi laburrak eta zuzenak)",
        "groqComplexityIntermediate": "Eskolakoa / Egunerokoa (naturala eta osoa)",
        "groqComplexityAdvanced": "Aurreratua / Fluidoa",
        "groqUserContext": "Familia Ingurunea eta Hiztegia (Aukerakoa)",
        "groqUserContextPlaceholder": "Adib.: Erabiltzailearen izena: Lucas. Aita: Carlos. Ama: Ana. Anaia: Mateo. Maskota: Toby (txakurra). Terpeuta: Marta.",
        "groqUserContextHelp": "Eman senideen, maskoten edo ohiko lekuen izenak AIak berehala ezagutzeko eta testuinguruan jartzeko.",
        "groqDictionaryTitle": "Esaldi Hiztegia eta Cachea",
        "groqDictionarySummary": "{count} esaldi ikasi eta gorde dira gailu honetan",
        "groqOpenDictionary": "Ikusi eta Editatu Hiztegia",
        "groqDictionaryEmpty": "Oraindik ez dago esaldirik hiztegian. Automatikoki gordeko dira tauletan Erreproduzitu sakatzean.",
        "groqDictColPictos": "Piktogramen Sekuentzia (Sarrera)",
        "groqDictColSentence": "Esaldi Konjugatua (Irteera)",
        "groqDictSearchPlaceholder": "Bilatu piktograma edo esaldiaren arabera...",
        "groqDictAddNew": "Gehitu esaldi pertsonalizatua",
        "groqDictSave": "Gorde",
        "groqDictConfirmDelete": "Ziur zaude esaldi hau hiztegitik ezabatu nahi duzula?",
        "groqDictConfirmClearAll": "Ziur zaude hiztegiko eta cacheko esaldi guztiak garbitu nahi dituzula?",
        "groqRecentPhrases": "Azken esaldiak",
        "groqRecentPhrasesTitle": "Hitz egindako esaldien historia",
        "groqRecentPhrasesEmpty": "Oraindik ez dago azken esaldirik. Hasi esaldiak sortzen taula batean Erreproduzitu sakatuta.",
        "groqStatusOnline": "Groq AI: Konektatuta",
        "groqStatusCache": "Groq AI: Tokiko cachetik (0 ms)",
        "groqStatusOffline": "Groq AI: Lineaz kanpoko modua",
        "groqClearHistory": "Garbitu historia",
        "groqClearHistoryConfirm": "Ziur zaude azken esaldien historia garbitu nahi duzula?",
        "groqSpeakAgain": "Entzun berriro",
        "noteThatActivatingGroqSendsSentences": "Kontuan izan funtzio hau aktibatzean sortutako esaldi guztiak Groq-en APIra bidaliko direla hizkuntza naturalaren tratamendurako eta konjugaziorako.",
        "groqDictSingleCount": "esaldi",
        "groqDictPluralCount": "esaldi",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutoriala: Nola lortu zure doako Groq AI API Gakoa",
        "groqTutorialSubtitle": "Jarraitu urrats erraz hauek AsTeRICS-Grid-en adimen artifiziala doan aktibatzeko.",
        "groqTutorialStep1Title": "1. Urratsa: Sartu Groq kontsolara",
        "groqTutorialStep1Desc": "Sartu Groq Cloud gakoak kudeatzeko orri ofizialean beheko botoia sakatuta.",
        "groqTutorialStep2Title": "2. Urratsa: Hasi saioa edo eman izena doan",
        "groqTutorialStep2Desc": "Google edo GitHub kontuarekin azkar hasi zaitezke saioa klik bakarrean.",
        "groqTutorialStep3Title": "3. Urratsa: Sortu zure API Gakoa",
        "groqTutorialStep3Desc": "Egin klik 'Create API Key' botoian, jarri izen bat eta sakatu 'Submit'.",
        "groqTutorialStep4Title": "4. Urratsa: Kopiatu eta itsatsi gakoa Asterics-en",
        "groqTutorialStep4Desc": "'gsk_...' hasten den gakoa kopiatu, itzuli pantaila honetara eta sakatu 'Egiaztatu APIa'.",
        "groqTutorialNoticeTitle": "Guztiz Doakoa eta Segurua",
        "groqTutorialNoticeDesc": "Groq-ek doako plana eskaintzen du egunean milaka eskaerarekin. Gakoa gailu honen memorian bakarrik gordetzen da.",
        "groqTutorialOpenConsoleBtn": "Ireki Groq kontsola"
    },
    "fr": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Activer la correction et la conjugaison grammaticale automatique via l'API Groq",
        "groqApiKey": "Clé API Groq",
        "verifyApiKey": "Vérifier l'API",
        "verifyingApiKey": "Vérification...",
        "groqApiKeyValid": "Clé API valide",
        "groqApiKeyInvalid": "Clé API invalide",
        "groqApiKeyEmpty": "Veuillez saisir une clé API",
        "groqModel": "Modèle",
        "groqGender": "Genre de l'utilisateur",
        "groqGenderNeutral": "Neutre / Général",
        "groqGenderMale": "Masculin / Garçon",
        "groqGenderFemale": "Féminin / Fille",
        "groqComplexity": "Niveau de langue",
        "groqComplexityBasic": "Enfant / Débutant (phrases courtes et directes)",
        "groqComplexityIntermediate": "Scolaire / Quotidien (naturel et complet)",
        "groqComplexityAdvanced": "Avancé / Fluide",
        "groqUserContext": "Environnement et Vocabulaire Familial (Optionnel)",
        "groqUserContextPlaceholder": "Ex: Nom de l'utilisateur: Lucas. Papa: Carlos. Maman: Ana. Frère: Mateo. Animal: Toby (chien). Thérapeute: Marta.",
        "groqUserContextHelp": "Fournissez les noms des proches, animaux ou lieux pour une reconnaissance contextuelle immédiate par l'IA.",
        "groqDictionaryTitle": "Dictionnaire de Phrases & Cache",
        "groqDictionarySummary": "{count} phrases apprises et mémorisées sur cet appareil",
        "groqOpenDictionary": "Voir et modifier le dictionnaire",
        "groqDictionaryEmpty": "Aucune phrase dans le dictionnaire pour le moment. Elles seront enregistrées automatiquement en appuyant sur Lecture.",
        "groqDictColPictos": "Séquence de Pictogrammes (Entrée)",
        "groqDictColSentence": "Phrase Conjuguée (Sortie)",
        "groqDictSearchPlaceholder": "Rechercher par pictogramme ou phrase...",
        "groqDictAddNew": "Ajouter une phrase personnalisée",
        "groqDictSave": "Enregistrer",
        "groqDictConfirmDelete": "Voulez-vous supprimer cette phrase du dictionnaire ?",
        "groqDictConfirmClearAll": "Voulez-vous vraiment effacer toutes les phrases du dictionnaire et du cache ?",
        "groqRecentPhrases": "Phrases récentes",
        "groqRecentPhrasesTitle": "Historique des phrases parlées",
        "groqRecentPhrasesEmpty": "Aucune phrase récente pour l'instant. Appuyez sur Lecture sur un tableau pour commencer.",
        "groqStatusOnline": "Groq IA: En ligne",
        "groqStatusCache": "Groq IA: Depuis le cache local (0 ms)",
        "groqStatusOffline": "Groq IA: Mode hors ligne",
        "groqClearHistory": "Effacer l'historique",
        "groqClearHistoryConfirm": "Êtes-vous sûr de vouloir effacer l'historique des phrases récentes ?",
        "groqSpeakAgain": "Écouter à nouveau",
        "noteThatActivatingGroqSendsSentences": "Veuillez noter que l'activation de cette fonctionnalité entraîne l'envoi de toutes les phrases construites à l'API de Groq pour leur traitement et conjugaison en langage naturel.",
        "groqDictSingleCount": "phrase",
        "groqDictPluralCount": "phrases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutoriel : Comment obtenir votre clé gratuite pour l'API Groq IA",
        "groqTutorialSubtitle": "Suivez ces étapes simples pour activer l'intelligence artificielle dans AsTeRICS-Grid gratuitement et sans carte bancaire.",
        "groqTutorialStep1Title": "Étape 1 : Accéder à la console Groq",
        "groqTutorialStep1Desc": "Rendez-vous sur la page officielle de gestion des clés Groq Cloud en cliquant sur le bouton ci-dessous.",
        "groqTutorialStep2Title": "Étape 2 : Connectez-vous ou inscrivez-vous gratuitement",
        "groqTutorialStep2Desc": "Vous pouvez vous connecter rapidement avec votre compte Google ou GitHub en un clic.",
        "groqTutorialStep3Title": "Étape 3 : Créez votre clé API",
        "groqTutorialStep3Desc": "Cliquez sur 'Create API Key', donnez-lui un nom (ex. Asterics) et cliquez sur 'Submit'.",
        "groqTutorialStep4Title": "Étape 4 : Copiez et collez la clé dans Asterics",
        "groqTutorialStep4Desc": "Copiez la clé commençant par 'gsk_...', revenez sur cet écran, collez-la et cliquez sur 'Vérifier l'API'.",
        "groqTutorialNoticeTitle": "Entièrement Gratuit et Sécurisé",
        "groqTutorialNoticeDesc": "Groq propose un forfait gratuit généreux avec des milliers de requêtes par jour. La clé est stockée uniquement sur cet appareil.",
        "groqTutorialOpenConsoleBtn": "Ouvrir la console Groq"
    },
    "de": {
        "groq": "Groq (KI)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Automatische Grammatikkorrektur und Konjugation über die Groq-API aktivieren",
        "groqApiKey": "Groq-API-Schlüssel",
        "verifyApiKey": "API überprüfen",
        "verifyingApiKey": "Wird überprüft...",
        "groqApiKeyValid": "Gültiger API-Schlüssel",
        "groqApiKeyInvalid": "Ungültiger API-Schlüssel",
        "groqApiKeyEmpty": "Bitte geben Sie einen API-Schlüssel ein",
        "groqModel": "Modell",
        "groqGender": "Geschlecht des Benutzers",
        "groqGenderNeutral": "Neutral / Allgemein",
        "groqGenderMale": "Männlich / Junge",
        "groqGenderFemale": "Weiblich / Mädchen",
        "groqComplexity": "Sprachniveau",
        "groqComplexityBasic": "Kindgerecht / Anfänger (kurze & direkte Sätze)",
        "groqComplexityIntermediate": "Schule / Alltag (natürlich & vollständig)",
        "groqComplexityAdvanced": "Fortgeschritten / Fließend",
        "groqUserContext": "Familiäres Umfeld & Wortschatz (Optional)",
        "groqUserContextPlaceholder": "Z.B.: Benutzername: Lucas. Vater: Carlos. Mutter: Ana. Bruder: Mateo. Haustier: Toby (Hund). Therapeut: Marta.",
        "groqUserContextHelp": "Geben Sie Namen von Familienmitgliedern, Haustieren oder Orten zur sofortigen KI-Erkennung an.",
        "groqDictionaryTitle": "Satz-Wörterbuch & Cache",
        "groqDictionarySummary": "{count} gelernte Sätze lokal auf diesem Gerät gespeichert",
        "groqOpenDictionary": "Wörterbuch anzeigen & bearbeiten",
        "groqDictionaryEmpty": "Noch keine Sätze im Wörterbuch. Sie werden beim Abspielen auf den Tafeln automatisch gespeichert.",
        "groqDictColPictos": "Piktogrammfolge (Eingabe)",
        "groqDictColSentence": "Konjugierter Satz (Ausgabe)",
        "groqDictSearchPlaceholder": "Nach Piktogramm oder Satz suchen...",
        "groqDictAddNew": "Benutzerdefinierten Satz hinzufügen",
        "groqDictSave": "Speichern",
        "groqDictConfirmDelete": "Möchten Sie diesen Satz aus dem Wörterbuch löschen?",
        "groqDictConfirmClearAll": "Möchten Sie wirklich alle Sätze aus dem Wörterbuch und Cache löschen?",
        "groqRecentPhrases": "Kürzliche Sätze",
        "groqRecentPhrasesTitle": "Verlauf der gesprochenen Sätze",
        "groqRecentPhrasesEmpty": "Noch keine aktuellen Sätze. Drücken Sie auf Abspielen, um zu beginnen.",
        "groqStatusOnline": "Groq KI: Verbunden",
        "groqStatusCache": "Groq KI: Aus lokalem Cache (0 ms)",
        "groqStatusOffline": "Groq KI: Offline-Modus",
        "groqClearHistory": "Verlauf löschen",
        "groqClearHistoryConfirm": "Möchten Sie den Verlauf der letzten Sätze wirklich löschen?",
        "groqSpeakAgain": "Erneut anhören",
        "noteThatActivatingGroqSendsSentences": "Bitte beachten Sie, dass bei Aktivierung dieser Funktion alle erstellten Sätze zur Verarbeitung an die Groq-API gesendet werden.",
        "groqDictSingleCount": "Satz",
        "groqDictPluralCount": "Sätze",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Anleitung: So erhalten Sie Ihren kostenlosen Groq-KI-API-Schlüssel",
        "groqTutorialSubtitle": "Befolgen Sie diese einfachen Schritte, um die künstliche Intelligenz in AsTeRICS-Grid 100% kostenlos zu aktivieren.",
        "groqTutorialStep1Title": "Schritt 1: Groq-Konsole aufrufen",
        "groqTutorialStep1Desc": "Rufen Sie die offizielle Seite zur Schlüsselverwaltung von Groq Cloud über die Schaltfläche unten auf.",
        "groqTutorialStep2Title": "Schritt 2: Kostenlos anmelden oder registrieren",
        "groqTutorialStep2Desc": "Sie können sich mit einem Klick über Ihr Google- oder GitHub-Konto anmelden.",
        "groqTutorialStep3Title": "Schritt 3: API-Schlüssel erstellen",
        "groqTutorialStep3Desc": "Klicken Sie auf 'Create API Key', vergeben Sie einen Namen (z.B. Asterics) und klicken Sie auf 'Submit'.",
        "groqTutorialStep4Title": "Schritt 4: Schlüssel kopieren und in Asterics einfügen",
        "groqTutorialStep4Desc": "Kopieren Sie den Schlüssel mit 'gsk_...', fügen Sie ihn hier ein und klicken Sie auf 'API überprüfen'.",
        "groqTutorialNoticeTitle": "Völlig kostenlos und sicher",
        "groqTutorialNoticeDesc": "Groq bietet ein großzügiges kostenloses Kontingent mit Tausenden von Anfragen pro Tag. Der Schlüssel wird nur lokal gespeichert.",
        "groqTutorialOpenConsoleBtn": "Groq-Konsole öffnen"
    },
    "it": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Attiva la correzione e coniugazione grammaticale automatica tramite l'API di Groq",
        "groqApiKey": "Chiave API Groq",
        "verifyApiKey": "Verifica API",
        "verifyingApiKey": "Verifica in corso...",
        "groqApiKeyValid": "Chiave API valida",
        "groqApiKeyInvalid": "Chiave API non valida",
        "groqApiKeyEmpty": "Inserisci una chiave API",
        "groqModel": "Modello",
        "groqGender": "Genere dell'utente",
        "groqGenderNeutral": "Neutro / Generale",
        "groqGenderMale": "Maschile / Bambino",
        "groqGenderFemale": "Femminile / Bambina",
        "groqComplexity": "Livello linguistico",
        "groqComplexityBasic": "Infantile / Iniziale (frasi brevi e dirette)",
        "groqComplexityIntermediate": "Scolastico / Quotidiano (naturale e completo)",
        "groqComplexityAdvanced": "Avanzato / Fluido",
        "groqUserContext": "Ambiente e Vocabolario Familiare (Opzionale)",
        "groqUserContextPlaceholder": "Es: Nome utente: Lucas. Papà: Carlos. Mamma: Ana. Fratello: Mateo. Animale: Toby (cane). Terapeuta: Marta.",
        "groqUserContextHelp": "Fornisci i nomi di familiari, animali domestici o luoghi abituali per il riconoscimento immediato da parte dell'IA.",
        "groqDictionaryTitle": "Dizionario delle Frasi & Cache",
        "groqDictionarySummary": "{count} frasi apprese e memorizzate su questo dispositivo",
        "groqOpenDictionary": "Visualizza e modifica il dizionario",
        "groqDictionaryEmpty": "Nessuna frase nel dizionario per il momento. Verranno salvate automaticamente premendo Riproduci sui tabelloni.",
        "groqDictColPictos": "Sequenza di Pittogrammi (Input)",
        "groqDictColSentence": "Frase Coniugata (Output)",
        "groqDictSearchPlaceholder": "Cerca per pittogramma o frase...",
        "groqDictAddNew": "Aggiungi frase personalizzata",
        "groqDictSave": "Salva",
        "groqDictConfirmDelete": "Vuoi eliminare questa frase dal dizionario?",
        "groqDictConfirmClearAll": "Sei sicuro di voler cancellare tutte le frasi dal dizionario e dalla cache?",
        "groqRecentPhrases": "Frasi recenti",
        "groqRecentPhrasesTitle": "Cronologia delle frasi pronunciate",
        "groqRecentPhrasesEmpty": "Ancora nessuna frase recente. Premi Riproduci su un tabellone per iniziare.",
        "groqStatusOnline": "Groq IA: Connesso",
        "groqStatusCache": "Groq IA: Da cache locale (0 ms)",
        "groqStatusOffline": "Groq IA: Modalità offline",
        "groqClearHistory": "Cancella cronologia",
        "groqClearHistoryConfirm": "Sei sicuro di voler cancellare la cronologia delle frasi recenti?",
        "groqSpeakAgain": "Ascolta di nuovo",
        "noteThatActivatingGroqSendsSentences": "Si prega di notare che l'attivazione di questa funzione comporta l'invio di tutte le frasi costruite all'API di Groq per l'elaborazione in linguaggio naturale.",
        "groqDictSingleCount": "frase",
        "groqDictPluralCount": "frasi",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: Come ottenere la tua chiave API gratuita di Groq IA",
        "groqTutorialSubtitle": "Segui questi semplici passaggi per attivare l'intelligenza artificiale in AsTeRICS-Grid gratuitamente e senza carta di credito.",
        "groqTutorialStep1Title": "Passo 1: Accedi alla console Groq",
        "groqTutorialStep1Desc": "Visita la pagina ufficiale di gestione delle chiavi Groq Cloud facendo clic sul pulsante in basso.",
        "groqTutorialStep2Title": "Passo 2: Accedi o registrati gratis",
        "groqTutorialStep2Desc": "Puoi accedere rapidamente con il tuo account Google o GitHub con un solo clic.",
        "groqTutorialStep3Title": "Passo 3: Crea la tua chiave API",
        "groqTutorialStep3Desc": "Fai clic su 'Create API Key', inserisci un nome (es. Asterics) e clicca su 'Submit'.",
        "groqTutorialStep4Title": "Passo 4: Copia e incolla la chiave in Asterics",
        "groqTutorialStep4Desc": "Copia la chiave che inizia con 'gsk_...', torna qui, incollala e premi 'Verifica API'.",
        "groqTutorialNoticeTitle": "Completamente Gratuito e Sicuro",
        "groqTutorialNoticeDesc": "Groq offre un piano gratuito generoso con migliaia di richieste al giorno. La chiave viene salvata solo su questo dispositivo.",
        "groqTutorialOpenConsoleBtn": "Apri console Groq"
    },
    "pt": {
        "groq": "Groq (IA)",
        "activateAutomaticGrammarCorrectionGroqAPI": "Ativar correção e conjugação gramatical automática através da API do Groq",
        "groqApiKey": "Chave de API do Groq",
        "verifyApiKey": "Verificar API",
        "verifyingApiKey": "A verificar...",
        "groqApiKeyValid": "Chave de API válida",
        "groqApiKeyInvalid": "Chave de API inválida",
        "groqApiKeyEmpty": "Por favor, insira uma chave de API",
        "groqModel": "Modelo",
        "groqGender": "Género do utilizador",
        "groqGenderNeutral": "Neutro / Geral",
        "groqGenderMale": "Masculino / Menino",
        "groqGenderFemale": "Feminino / Menina",
        "groqComplexity": "Nível de linguagem",
        "groqComplexityBasic": "Infantil / Inicial (frases curtas e diretas)",
        "groqComplexityIntermediate": "Escolar / Quotidiano (natural e completo)",
        "groqComplexityAdvanced": "Avançado / Fluente",
        "groqUserContext": "Ambiente e Vocabulário Familiar (Opcional)",
        "groqUserContextPlaceholder": "Ex: Nome do utilizador: Lucas. Pai: Carlos. Mãe: Ana. Irmão: Mateo. Animal: Toby (cão). Terapeuta: Marta.",
        "groqUserContextHelp": "Forneça nomes de familiares, animais de estimação ou locais habituais para reconhecimento imediato pela IA.",
        "groqDictionaryTitle": "Dicionário de Frases & Cache",
        "groqDictionarySummary": "{count} frases aprendidas e memorizadas neste dispositivo",
        "groqOpenDictionary": "Ver e Editar Dicionário",
        "groqDictionaryEmpty": "Ainda não há frases no dicionário. Elas serão guardadas automaticamente ao premir Reproduzir nas grelhas.",
        "groqDictColPictos": "Sequência de Pictogramas (Entrada)",
        "groqDictColSentence": "Frase Conjugada (Saída)",
        "groqDictSearchPlaceholder": "Pesquisar por pictograma ou frase...",
        "groqDictAddNew": "Adicionar frase personalizada",
        "groqDictSave": "Guardar",
        "groqDictConfirmDelete": "Deseja eliminar esta frase do dicionário?",
        "groqDictConfirmClearAll": "Tem a certeza de que deseja apagar todas as frases do dicionário e da cache?",
        "groqRecentPhrases": "Frases recentes",
        "groqRecentPhrasesTitle": "Histórico de frases faladas",
        "groqRecentPhrasesEmpty": "Ainda não há frases recentes. Prima Reproduzir numa grelha para começar.",
        "groqStatusOnline": "Groq IA: Conectado",
        "groqStatusCache": "Groq IA: A partir da cache local (0 ms)",
        "groqStatusOffline": "Groq IA: Modo offline",
        "groqClearHistory": "Limpar histórico",
        "groqClearHistoryConfirm": "Tem a certeza de que deseja limpar o histórico de frases recentes?",
        "groqSpeakAgain": "Ouvir novamente",
        "noteThatActivatingGroqSendsSentences": "Tenha em atenção que a ativação desta funcionalidade resulta no envio de todas as frases construídas para a API do Groq para processamento em linguagem natural.",
        "groqDictSingleCount": "frase",
        "groqDictPluralCount": "frases",
        "groqTutorialBtn": "tutorial api IA",
        "groqTutorialTitle": "Tutorial: Como obter a sua chave gratuita da API do Groq IA",
        "groqTutorialSubtitle": "Siga estes passos simples para ativar a inteligência artificial no AsTeRICS-Grid 100% grátis e sem cartão de crédito.",
        "groqTutorialStep1Title": "Passo 1: Aceda à consola do Groq",
        "groqTutorialStep1Desc": "Aceda à página oficial de gestão de chaves do Groq Cloud clicando no botão abaixo.",
        "groqTutorialStep2Title": "Passo 2: Inicie sessão ou registe-se gratuitamente",
        "groqTutorialStep2Desc": "Pode iniciar sessão rapidamente com a sua conta Google ou GitHub num só clique.",
        "groqTutorialStep3Title": "Passo 3: Crie a sua chave de API",
        "groqTutorialStep3Desc": "Clique no botão 'Create API Key', atribua um nome (ex: Asterics) e clique em 'Submit'.",
        "groqTutorialStep4Title": "Passo 4: Copie e cole a chave no Asterics",
        "groqTutorialStep4Desc": "Copie a chave que começa por 'gsk_...', volte a este ecrã, cole-a e clique em 'Verificar API'.",
        "groqTutorialNoticeTitle": "Totalmente Gratuito e Seguro",
        "groqTutorialNoticeDesc": "O Groq oferece um plano gratuito generoso com milhares de pedidos diários. A chave fica guardada apenas neste dispositivo.",
        "groqTutorialOpenConsoleBtn": "Abrir consola do Groq"
    }
};

function applyGroqTranslations(lang) {
    if (!vueI18n || !lang) return;
    const baseLang = i18nService.getBaseLang(lang);
    const translations = GROQ_EMBEDDED_TRANSLATIONS[baseLang] || GROQ_EMBEDDED_TRANSLATIONS[lang] || (baseLang === 'es' ? GROQ_EMBEDDED_TRANSLATIONS.es : GROQ_EMBEDDED_TRANSLATIONS.en);
    if (translations) {
        vueI18n.mergeLocaleMessage(lang, translations);
    }
}

export { i18nService, GROQ_EMBEDDED_TRANSLATIONS, applyGroqTranslations };
