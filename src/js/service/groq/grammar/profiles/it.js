import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class ItalianGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('it', 'Italian');
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';
        const PERSON = ['papà', 'mamma', 'fratello', 'sorella', 'nonno', 'nonna', 'amico', 'maestro'];
        const PLACE = ['casa', 'macchina', 'parco', 'scuola', 'spiaggia', 'piscina', 'dottore'];
        let pIdx = -1, lIdx = -1, pWord = '', lWord = '';

        for (let i = 0; i < pictos.length; i++) {
            const w = pictos[i].toLowerCase();
            if (pIdx === -1 && PERSON.includes(w)) { pIdx = i; pWord = pictos[i]; }
            if (lIdx === -1 && PLACE.includes(w)) { lIdx = i; lWord = pictos[i]; }
        }

        if (pIdx !== -1 && lIdx !== -1) {
            if (pIdx < lIdx) {
                return `CRITICAL POSITIONAL CONSTRAINT: In Italian, [${pWord}] before [${lWord}] indicates accompaniment: "con ${pWord} a/al ${lWord}".`;
            } else {
                return `CRITICAL POSITIONAL CONSTRAINT: In Italian, [${lWord}] before [${pWord}] indicates destination/possession: "al ${lWord} con ${pWord}" or "a casa di ${pWord}".`;
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['ieri', 'prima', 'passato'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. Use Italian passato prossimo (e.g. "ieri sono andato", "ho mangiato").`;
            } else if (['domani', 'dopo', 'più tardi'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use future or present with temporal marker ("domani vado").`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['male', 'dolore', 'fame', 'sete', 'sonno', 'paura', 'piacere'].includes(p)) {
                return `CRITICAL SENSATION: In Italian, bodily states use: "mi fa male la testa", "mi fa male la pancia", "mi piace", "ho fame", "ho sete", "ho sonno", "ho paura".`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### REGOLE LINGUISTICHE PER L'ITALIANO (ITALIAN AAC RULES):
1. OMISSIONE NATURALE DEL SOGGETTO (PRO-DROP):
   - In italiano si omette normalmente il pronome soggetto "Io":
   - [volere] [acqua] -> "Voglio acqua." (NON "Io voglio acqua").
   - [andare] [parco] -> "Vado al parco."

2. PREPOSIZIONI ARTICOLATE:
   - a + il = al (al parco)
   - di + il = del (del papà)
   - in + il = nel (nel cassetto)
   - su + il = sul (sul tavolo)

3. SENSAZIONI CORPOREE E DOLORE:
   - [male] [testa] -> "Mi fa male la testa."
   - [male] [pancia] -> "Mi fa male la pancia."
   - [fame] -> "Ho fame."
   - [sete] -> "Ho sete."

4. RICHIESTE GENTILI (MAND):
   - [aprire] [porta] -> "Apri la porta, per favore."
   - [aiuto] -> "Aiutami, per favore."
   - [dare] [biscotto] -> "Dammi un biscotto, per favore."`;
    }
}

export { ItalianGrammarProfile };
