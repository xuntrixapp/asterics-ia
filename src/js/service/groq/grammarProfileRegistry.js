import { i18nService } from '../i18nService.js';
import { SpanishGrammarProfile } from './grammar/profiles/es.js';
import { EnglishGrammarProfile } from './grammar/profiles/en.js';
import { CatalanGrammarProfile } from './grammar/profiles/ca.js';
import { ValencianGrammarProfile } from './grammar/profiles/val.js';
import { GalicianGrammarProfile } from './grammar/profiles/gl.js';
import { BasqueGrammarProfile } from './grammar/profiles/eu.js';
import { FrenchGrammarProfile } from './grammar/profiles/fr.js';
import { GermanGrammarProfile } from './grammar/profiles/de.js';
import { ItalianGrammarProfile } from './grammar/profiles/it.js';
import { PortugueseGrammarProfile } from './grammar/profiles/pt.js';
import { BrazilianPortugueseGrammarProfile } from './grammar/profiles/pt_BR.js';
import { UniversalProfile } from './grammar/profiles/UniversalProfile.js';

let profileCache = new Map();

const PROFILE_CONSTRUCTORS = {
    'es': SpanishGrammarProfile,
    'en': EnglishGrammarProfile,
    'ca': CatalanGrammarProfile,
    'val': ValencianGrammarProfile,
    'gl': GalicianGrammarProfile,
    'eu': BasqueGrammarProfile,
    'fr': FrenchGrammarProfile,
    'de': GermanGrammarProfile,
    'it': ItalianGrammarProfile,
    'pt': PortugueseGrammarProfile,
    'pt_BR': BrazilianPortugueseGrammarProfile,
    'pt-br': BrazilianPortugueseGrammarProfile
};

const grammarProfileRegistry = {
    /**
     * Obtiene el perfil gramatical correspondiente para un código de idioma.
     * Si no hay un perfil nativo específico, instancia el UniversalProfile adaptado a esa lengua.
     * @param {string} langCode Código de idioma (ej. 'es', 'en', 'ca', 'ar', 'de', etc.)
     * @returns {BaseGrammarProfile}
     */
    getProfile(langCode) {
        let code = (langCode || 'es').trim();
        // Si viene con formato regional como es-ES o es_ES, normalizar
        let baseCode = code.toLowerCase();
        if (baseCode.includes('-')) {
            baseCode = baseCode.split('-')[0];
        } else if (baseCode.includes('_') && baseCode !== 'pt_br') {
            baseCode = baseCode.split('_')[0];
        }

        // Caso especial pt_BR
        if (code.toLowerCase() === 'pt-br' || code.toLowerCase() === 'pt_br') {
            baseCode = 'pt_BR';
        }

        if (profileCache.has(baseCode)) {
            return profileCache.get(baseCode);
        }

        let profile = null;
        if (PROFILE_CONSTRUCTORS[baseCode]) {
            const ProfileClass = PROFILE_CONSTRUCTORS[baseCode];
            profile = new ProfileClass();
        } else {
            // Resolver nombre legible del idioma
            let readableName = null;
            try {
                if (i18nService && typeof i18nService.getLangReadable === 'function') {
                    readableName = i18nService.getLangReadable(baseCode);
                }
            } catch (e) {}
            if (!readableName) {
                readableName = baseCode.toUpperCase();
            }
            profile = new UniversalProfile(baseCode, readableName);
        }

        profileCache.set(baseCode, profile);
        return profile;
    },

    /**
     * Limpia la caché de perfiles (útil para tests)
     */
    clearCache() {
        profileCache.clear();
    }
};

export { grammarProfileRegistry };
