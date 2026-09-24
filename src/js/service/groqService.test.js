jest.mock('./i18nService.js', () => ({
    i18nService: {
        getContentLangBase: () => 'es',
        getLangReadable: () => 'Spanish'
    }
}));
jest.mock('./data/dataService.js', () => ({
    dataService: {
        getMetadata: jest.fn().mockResolvedValue({ groqApiKey: 'dummy', groqModel: 'openai/gpt-oss-120b', groqGender: 'neutral' })
    }
}));
jest.mock('./data/localStorageService.js', () => ({
    localStorageService: {
        getAppSettings: jest.fn().mockReturnValue({ groqApiKey: 'dummy', groqModel: 'openai/gpt-oss-120b', groqGender: 'neutral' })
    }
}));

import { groqService } from './groqService.js';

describe('groqService tests', () => {
    test('cleanDoubleTaps removes consecutive identical words case-insensitively', () => {
        expect(groqService.cleanDoubleTaps('yo yo quiero quiero agua agua')).toBe('yo quiero agua');
        expect(groqService.cleanDoubleTaps('Casa casa Papa papa')).toBe('Casa Papa');
        expect(groqService.cleanDoubleTaps('ir parque parque papa')).toBe('ir parque papa');
        expect(groqService.cleanDoubleTaps('')).toBe('');
        expect(groqService.cleanDoubleTaps(null)).toBe('');
    });

    test('getCorrectGrammar returns empty or falsy text as is', async () => {
        expect(await groqService.getCorrectGrammar('')).toBe('');
        expect(await groqService.getCorrectGrammar(null)).toBe(null);
    });

    test('cleanDoubleTaps handles comma separated words', () => {
        expect(groqService.cleanDoubleTaps('yo, yo, quiero, quiero, agua')).toBe('yo quiero agua');
    });

    test('getStatus and setStatus manage status correctly', () => {
        groqService.setStatus('online');
        expect(groqService.getStatus()).toBe('online');
        groqService.setStatus('cache');
        expect(groqService.getStatus()).toBe('cache');
        groqService.setStatus('fallback');
        expect(groqService.getStatus()).toBe('fallback');
    });

    test('recent phrases management', () => {
        groqService.clearRecentPhrases();
        expect(groqService.getRecentPhrases()).toEqual([]);

        groqService.addRecentPhrase('Quiero agua', 'yo quiero agua');
        expect(groqService.getRecentPhrases().length).toBe(1);
        expect(groqService.getRecentPhrases()[0].text).toBe('Quiero agua');

        // Avoid immediate duplicate
        groqService.addRecentPhrase('Quiero agua', 'yo quiero agua');
        expect(groqService.getRecentPhrases().length).toBe(1);

        groqService.addRecentPhrase('Voy al parque con papá', 'ir parque papa');
        expect(groqService.getRecentPhrases().length).toBe(2);
        expect(groqService.getRecentPhrases()[0].text).toBe('Voy al parque con papá');

        groqService.clearRecentPhrases();
        expect(groqService.getRecentPhrases()).toEqual([]);
    });

    test('normalizeAccents normalizes common AAC words with missing accents', () => {
        expect(groqService.normalizeAccents('papa')).toBe('papá');
        expect(groqService.normalizeAccents('mama')).toBe('mamá');
        expect(groqService.normalizeAccents('quiero ir papa casa')).toBe('quiero ir papá casa');
        expect(groqService.normalizeAccents('musica y platano')).toBe('música y plátano');
        expect(groqService.normalizeAccents('')).toBe('');
        expect(groqService.normalizeAccents(null)).toBe('');
    });

    test('analyzePositionalSemantics distinguishes accompaniment vs possession', () => {
        // Person before Place -> Acompañamiento
        const accompaniment = groqService.analyzePositionalSemantics(['quiero', 'ir', 'papá', 'casa']);
        expect(accompaniment).toContain('ACCOMPANIMENT');
        expect(accompaniment).toContain('con papá a casa');
        expect(accompaniment).toContain('MUST NOT say "casa de papá"');

        // Place before Person (possessable) -> Posesión
        const possession = groqService.analyzePositionalSemantics(['quiero', 'ir', 'casa', 'papá']);
        expect(possession).toContain('POSSESSION');
        expect(possession).toContain('a casa de papá');
        expect(possession).toContain('MUST NOT say "con papá"');

        // Public Place before Person -> al parque con papá
        const publicPlace = groqService.analyzePositionalSemantics(['ir', 'parque', 'papá']);
        expect(publicPlace).toContain('al parque con papá');

        // Sequence without person or place
        expect(groqService.analyzePositionalSemantics(['quiero', 'agua'])).toBe('');
        expect(groqService.analyzePositionalSemantics([])).toBe('');
    });

    test('analyzeTemporalContext detects past, future and present markers', () => {
        const past = groqService.analyzeTemporalContext(['ayer', 'ir', 'parque']);
        expect(past).toContain('CRITICAL TEMPORAL CONSTRAINT');
        expect(past).toContain('PAST tense');
        expect(past).toContain('ayer');

        const future = groqService.analyzeTemporalContext(['mañana', 'ir', 'médico']);
        expect(future).toContain('CRITICAL TEMPORAL CONSTRAINT');
        expect(future).toContain('FUTURE tense');
        expect(future).toContain('mañana');

        const present = groqService.analyzeTemporalContext(['ahora', 'querer', 'jugar']);
        expect(present).toContain('CRITICAL TEMPORAL CONSTRAINT');
        expect(present).toContain('present tense');
        expect(present).toContain('ahora');

        expect(groqService.analyzeTemporalContext(['quiero', 'agua'])).toBe('');
        expect(groqService.analyzeTemporalContext([])).toBe('');
    });

    test('dictionary management methods (add, update, delete, clear, count, entries)', () => {
        groqService.clearDictionary();
        expect(groqService.getDictionaryCount()).toBe(0);
        expect(groqService.getDictionaryEntries()).toEqual([]);

        // Add custom entry
        const added = groqService.addCustomDictionaryEntry('quiero ir cine', 'Quiero ir al cine.');
        expect(added).toBe(true);
        expect(groqService.getDictionaryCount()).toBe(1);

        const entries = groqService.getDictionaryEntries();
        expect(entries.length).toBe(1);
        expect(entries[0].sentence).toBe('Quiero ir al cine.');
        expect(entries[0].rawText).toBe('quiero ir cine');

        // Update entry
        const key = entries[0].key;
        const updated = groqService.updateDictionaryEntry(key, 'Quiero ir al cine con papá.', 'quiero ir cine papa');
        expect(updated).toBe(true);

        const updatedEntries = groqService.getDictionaryEntries();
        expect(updatedEntries[0].sentence).toBe('Quiero ir al cine con papá.');
        expect(updatedEntries[0].rawText).toBe('quiero ir cine papa');

        // Delete entry
        const deleted = groqService.deleteDictionaryEntry(key);
        expect(deleted).toBe(true);
        expect(groqService.getDictionaryCount()).toBe(0);

        // Clear dictionary
        groqService.addCustomDictionaryEntry('hola', 'Hola, buenos días.');
        expect(groqService.getDictionaryCount()).toBe(1);
        groqService.clearDictionary();
        expect(groqService.getDictionaryCount()).toBe(0);
    });

    test('analyzeSpeechAct distinguishes polite request to adult vs own action', () => {
        // Without 'yo' -> Request to adult
        const request = groqService.analyzeSpeechAct(['abrir', 'puerta']);
        expect(request).toContain('CRITICAL SPEECH-ACT CONSTRAINT');
        expect(request).toContain('REQUEST / MAND');
        expect(request).toContain('abrir');

        const help = groqService.analyzeSpeechAct(['ayuda', 'por favor']);
        expect(help).toContain('REQUEST / MAND');

        // With 'yo' -> User's own action
        const ownAction = groqService.analyzeSpeechAct(['yo', 'abrir', 'puerta']);
        expect(ownAction).toContain('CRITICAL SPEECH-ACT CONSTRAINT');
        expect(ownAction).toContain('OWN intended action');

        // Non-action sequence
        expect(groqService.analyzeSpeechAct(['manzana', 'roja'])).toBe('');
        expect(groqService.analyzeSpeechAct([])).toBe('');
    });

    test('analyzePsychologicalAndPhysicalVerbs detects affection and sensation verbs', () => {
        const gustar = groqService.analyzePsychologicalAndPhysicalVerbs(['yo', 'gustar', 'coche']);
        expect(gustar).toContain('CRITICAL AFFECTION/SENSATION CONSTRAINT');
        expect(gustar).toContain('involuntary indirect clitic');
        expect(gustar).toContain('gustar');

        const doler = groqService.analyzePsychologicalAndPhysicalVerbs(['dolor', 'barriga']);
        expect(doler).toContain('CRITICAL AFFECTION/SENSATION CONSTRAINT');

        const miedo = groqService.analyzePsychologicalAndPhysicalVerbs(['miedo', 'perro']);
        expect(miedo).toContain('CRITICAL AFFECTION/SENSATION CONSTRAINT');

        expect(groqService.analyzePsychologicalAndPhysicalVerbs(['pelota', 'verde'])).toBe('');
        expect(groqService.analyzePsychologicalAndPhysicalVerbs([])).toBe('');
    });

    test('analyzeQuantifiersAndNumbers detects plural quantities requiring plural nouns', () => {
        const num = groqService.analyzeQuantifiersAndNumbers(['dos', 'galleta']);
        expect(num).toContain('CRITICAL NUMBER AGREEMENT CONSTRAINT');
        expect(num).toContain('PLURALIZED');
        expect(num).toContain('dos');

        const much = groqService.analyzeQuantifiersAndNumbers(['mucho', 'juguete']);
        expect(much).toContain('CRITICAL NUMBER AGREEMENT CONSTRAINT');
        expect(much).toContain('mucho');

        expect(groqService.analyzeQuantifiersAndNumbers(['galleta'])).toBe('');
        expect(groqService.analyzeQuantifiersAndNumbers([])).toBe('');
    });

    test('analyzeConnectors detects causal and finality connectors', () => {
        const causal = groqService.analyzeConnectors(['llorar', 'porque', 'doler', 'mano']);
        expect(causal).toContain('CRITICAL CONNECTOR CONSTRAINT');
        expect(causal).toContain('cause/reason');

        const finality = groqService.analyzeConnectors(['lápiz', 'para', 'dibujar']);
        expect(finality).toContain('CRITICAL CONNECTOR CONSTRAINT');
        expect(finality).toContain('purpose/finality');

        expect(groqService.analyzeConnectors(['quiero', 'agua'])).toBe('');
        expect(groqService.analyzeConnectors([])).toBe('');
    });
});

