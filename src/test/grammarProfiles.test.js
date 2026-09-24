jest.mock('../js/service/i18nService.js', () => ({
    i18nService: {
        getContentLangBase: () => 'es',
        getLangReadable: (code) => {
            const map = { ar: 'Arabic', ru: 'Russian', pl: 'Polish', tr: 'Turkish' };
            return map[code] || code.toUpperCase();
        }
    }
}));
jest.mock('../js/service/data/dataService.js', () => ({
    dataService: {
        getMetadata: jest.fn().mockResolvedValue({ groqApiKey: 'dummy', groqModel: 'openai/gpt-oss-120b', groqGender: 'neutral' })
    }
}));
jest.mock('../js/service/data/localStorageService.js', () => ({
    localStorageService: {
        getAppSettings: jest.fn().mockReturnValue({ groqApiKey: 'dummy', groqModel: 'openai/gpt-oss-120b', groqGender: 'neutral' })
    }
}));

import { grammarProfileRegistry } from '../js/service/groq/grammarProfileRegistry.js';
import { groqService } from '../js/service/groqService.js';
import { SpanishGrammarProfile } from '../js/service/groq/grammar/profiles/es.js';
import { EnglishGrammarProfile } from '../js/service/groq/grammar/profiles/en.js';
import { CatalanGrammarProfile } from '../js/service/groq/grammar/profiles/ca.js';
import { ValencianGrammarProfile } from '../js/service/groq/grammar/profiles/val.js';
import { GalicianGrammarProfile } from '../js/service/groq/grammar/profiles/gl.js';
import { BasqueGrammarProfile } from '../js/service/groq/grammar/profiles/eu.js';
import { FrenchGrammarProfile } from '../js/service/groq/grammar/profiles/fr.js';
import { GermanGrammarProfile } from '../js/service/groq/grammar/profiles/de.js';
import { ItalianGrammarProfile } from '../js/service/groq/grammar/profiles/it.js';
import { PortugueseGrammarProfile } from '../js/service/groq/grammar/profiles/pt.js';
import { UniversalProfile } from '../js/service/groq/grammar/profiles/UniversalProfile.js';

describe('Multilingual Grammar Profiles Architecture', () => {

    beforeEach(() => {
        grammarProfileRegistry.clearCache();
    });

    describe('grammarProfileRegistry', () => {
        test('resolves Spanish profile for "es" and "es-ES"', () => {
            const p1 = grammarProfileRegistry.getProfile('es');
            const p2 = grammarProfileRegistry.getProfile('es-ES');
            expect(p1).toBeInstanceOf(SpanishGrammarProfile);
            expect(p2).toBeInstanceOf(SpanishGrammarProfile);
            expect(p1.langCode).toBe('es');
        });

        test('resolves English profile for "en" and "en-US"', () => {
            const p1 = grammarProfileRegistry.getProfile('en');
            const p2 = grammarProfileRegistry.getProfile('en-US');
            expect(p1).toBeInstanceOf(EnglishGrammarProfile);
            expect(p2).toBeInstanceOf(EnglishGrammarProfile);
            expect(p1.langCode).toBe('en');
        });

        test('resolves Catalan and Valencian profiles', () => {
            const ca = grammarProfileRegistry.getProfile('ca');
            const val = grammarProfileRegistry.getProfile('val');
            expect(ca).toBeInstanceOf(CatalanGrammarProfile);
            expect(val).toBeInstanceOf(ValencianGrammarProfile);
            expect(ca.langCode).toBe('ca');
            expect(val.langCode).toBe('val');
        });

        test('resolves Galician and Basque profiles', () => {
            const gl = grammarProfileRegistry.getProfile('gl');
            const eu = grammarProfileRegistry.getProfile('eu');
            expect(gl).toBeInstanceOf(GalicianGrammarProfile);
            expect(eu).toBeInstanceOf(BasqueGrammarProfile);
        });

        test('resolves French, German, Italian, and Portuguese profiles', () => {
            expect(grammarProfileRegistry.getProfile('fr')).toBeInstanceOf(FrenchGrammarProfile);
            expect(grammarProfileRegistry.getProfile('de')).toBeInstanceOf(GermanGrammarProfile);
            expect(grammarProfileRegistry.getProfile('it')).toBeInstanceOf(ItalianGrammarProfile);
            expect(grammarProfileRegistry.getProfile('pt')).toBeInstanceOf(PortugueseGrammarProfile);
            expect(grammarProfileRegistry.getProfile('pt-BR')).toBeInstanceOf(PortugueseGrammarProfile);
        });

        test('resolves UniversalProfile for any of the other 57 languages', () => {
            const ar = grammarProfileRegistry.getProfile('ar');
            const ru = grammarProfileRegistry.getProfile('ru');
            const pl = grammarProfileRegistry.getProfile('pl');
            const tr = grammarProfileRegistry.getProfile('tr');

            expect(ar).toBeInstanceOf(UniversalProfile);
            expect(ar.langCode).toBe('ar');
            expect(ru).toBeInstanceOf(UniversalProfile);
            expect(ru.langCode).toBe('ru');
            expect(pl).toBeInstanceOf(UniversalProfile);
            expect(tr).toBeInstanceOf(UniversalProfile);
        });
    });

    describe('SpanishGrammarProfile (es)', () => {
        const es = new SpanishGrammarProfile();

        test('analyzes temporal past, future and present', () => {
            expect(es.analyzeTemporalContext(['ayer', 'ir', 'parque'])).toContain('PAST tense');
            expect(es.analyzeTemporalContext(['mañana', 'ir', 'médico'])).toContain('FUTURE tense');
            expect(es.analyzeTemporalContext(['ahora', 'querer', 'agua'])).toContain('present tense');
        });

        test('analyzes speech acts (MAND vs first person)', () => {
            expect(es.analyzeSpeechAct(['abrir', 'puerta'])).toContain('polite REQUEST / MAND');
            expect(es.analyzeSpeechAct(['yo', 'abrir', 'puerta'])).toContain("user's OWN intended action");
        });

        test('analyzes sensation verbs (gustar, doler)', () => {
            expect(es.analyzePsychologicalAndPhysicalVerbs(['gustar', 'coche'])).toContain('involuntary indirect clitic');
            expect(es.analyzePsychologicalAndPhysicalVerbs(['dolor', 'cabeza'])).toContain('involuntary indirect clitic');
        });

        test('analyzes position semantics (person vs place)', () => {
            expect(es.analyzePositionalSemantics(['papá', 'parque'])).toContain('ACCOMPANIMENT');
            expect(es.analyzePositionalSemantics(['casa', 'papá'])).toContain('POSSESSION');
        });

        test('buildSystemPrompt contains 15 Spanish AAC pillars and gender/complexity', () => {
            const prompt = es.buildSystemPrompt({ gender: 'female', complexity: 'basic' });
            expect(prompt).toContain('Spanish');
            expect(prompt).toContain('FEMENINO');
            expect(prompt).toContain('INFANTIL');
            expect(prompt).toContain('PILAR A');
            expect(prompt).toContain('PILAR N');
            expect(prompt).toContain('PILAR O');
        });
    });

    describe('EnglishGrammarProfile (en)', () => {
        const en = new EnglishGrammarProfile();

        test('analyzes English temporal markers', () => {
            expect(en.analyzeTemporalContext(['yesterday', 'go', 'park'])).toContain('PAST tense');
            expect(en.analyzeTemporalContext(['tomorrow', 'go', 'doctor'])).toContain('FUTURE tense');
        });

        test('analyzes English polite requests (MAND)', () => {
            expect(en.analyzeSpeechAct(['open', 'door'])).toContain('polite REQUEST / MAND');
            expect(en.analyzeSpeechAct(['i', 'open', 'door'])).toContain("user's OWN action");
        });

        test('analyzes English sensations', () => {
            expect(en.analyzePsychologicalAndPhysicalVerbs(['hurt', 'head'])).toContain('My [body part] hurts');
            expect(en.analyzePsychologicalAndPhysicalVerbs(['hungry'])).toContain('I am [hungry/tired/cold/thirsty]');
        });

        test('buildSystemPrompt contains English-specific pillars and rules', () => {
            const prompt = en.buildSystemPrompt({ gender: 'male', complexity: 'advanced' });
            expect(prompt).toContain('English');
            expect(prompt).toContain('SUBJECT REQUIREMENT (NO PRO-DROP)');
            expect(prompt).toContain('ADJECTIVE BEFORE NOUN');
            expect(prompt).toContain('COUNTABLE VS UNCOUNTABLE');
            expect(prompt).not.toContain('PILAR A: MATRIZ DE REGLAS'); // Does not contain Spanish hardcoded text!
        });
    });

    describe('Catalan & Valencian Profiles (ca, val)', () => {
        test('Catalan contains apostrophation and clitic rules', () => {
            const ca = new CatalanGrammarProfile();
            const prompt = ca.buildSystemPrompt();
            expect(prompt).toContain('Catalan');
            expect(prompt).toContain('APOSTROFACIÓ OBLIGATÒRIA');
            expect(prompt).toContain('CONTRACCIONS NORMATIVES');
            expect(prompt).toContain("Em fa mal el cap");
        });

        test('Valencian includes specific Valencian variant guidelines', () => {
            const val = new ValencianGrammarProfile();
            const prompt = val.buildSystemPrompt();
            expect(prompt).toContain('Valencian');
            expect(prompt).toContain('VARIANT VALENCIANA');
            expect(prompt).toContain('xiquet/xiqueta');
        });
    });

    describe('groqService Delegations & Backwards Compatibility', () => {
        test('groqService heuristic methods delegate correctly to active language profile', () => {
            const spanishPos = groqService.analyzePositionalSemantics(['papá', 'parque'], 'es');
            expect(spanishPos).toContain('ACCOMPANIMENT');

            const englishPos = groqService.analyzePositionalSemantics(['dad', 'park'], 'en');
            expect(englishPos).toContain('ACCOMPANIMENT');

            const spanishTemp = groqService.analyzeTemporalContext(['ayer', 'jugar'], 'es');
            expect(spanishTemp).toContain('PAST tense');

            const englishTemp = groqService.analyzeTemporalContext(['yesterday', 'play'], 'en');
            expect(englishTemp).toContain('PAST tense');
        });
    });

});
