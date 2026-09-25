import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class GalicianGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('gl', 'Galician');
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';
        const PERSON = ['pai', 'nai', 'avó', 'avoa', 'irmán', 'tío', 'tía', 'amigo', 'mestre', 'terapeuta'];
        const PLACE = ['casa', 'coche', 'parque', 'escola', 'praia', 'hospital', 'médico'];
        let pIdx = -1, lIdx = -1, pWord = '', lWord = '';

        for (let i = 0; i < pictos.length; i++) {
            const w = pictos[i].toLowerCase();
            if (pIdx === -1 && PERSON.includes(w)) { pIdx = i; pWord = pictos[i]; }
            if (lIdx === -1 && PLACE.includes(w)) { lIdx = i; lWord = pictos[i]; }
        }

        if (pIdx !== -1 && lIdx !== -1) {
            if (pIdx < lIdx) {
                return `CRITICAL POSITIONAL CONSTRAINT: In Galician, [${pWord}] before [${lWord}] indicates company: "con ${pWord} a/ao ${lWord}".`;
            } else {
                return `CRITICAL POSITIONAL CONSTRAINT: In Galician, [${lWord}] before [${pWord}] indicates destination/possession: "ao ${lWord} con ${pWord}" or "á casa do ${pWord}".`;
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['onte', 'antes', 'pasado'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. Use Galician past tense (e.g. "onte fun", "comín").`;
            } else if (['mañá', 'mana', 'logo', 'despois'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use future ("mañá vou", "irei").`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['dor', 'doer', 'gostar', 'gustar', 'fame', 'sede', 'sono'].includes(p)) {
                return `CRITICAL SENSATION: In Galician use enclitic/standard clitics: "dóeme a cabeza", "gústame o coche", "teño sono", "teño fame", "teño sede".`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### REGRAS LINGÜÍSTICAS PARA GALEGO:
1. CONTRACCIÓNS OBRIGATORIAS:
   - a + o = ao / ó; a + a = á
   - de + o = do; de + a = da
   - en + o = no; en + a = na
   - con + o = co; con + a = coa

2. COLOCACIÓN DOS PRONOMES CLÍTICOS:
   - Enunciativas afirmativas: o pronome vai posposto ao verbo (enclítico): "Dóeme a cabeza", "Gústame o xoguete".
   - Negativas: vai antes do verbo: "Non me gusta".

3. OMISIÓN NATURAL DO PRONOME SUXEITO:
   - [querer] [auga] -> "Quero auga." (NON "Eu quero auga").

4. PETICIÓNS CORTESES (MAND):
   - [abrir] [porta] -> "Abre a porta, por favor."
   - [axuda] -> "Axúdame, por favor."`;
    }
}

export { GalicianGrammarProfile };
