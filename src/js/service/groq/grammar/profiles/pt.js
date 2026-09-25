import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class PortugueseGrammarProfile extends BaseGrammarProfile {
    constructor(langCode = 'pt', langName = 'Portuguese') {
        super(langCode, langName);
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';
        const PERSON = ['pai', 'papai', 'mãe', 'mamãe', 'irmão', 'irmã', 'avô', 'avó', 'amigo', 'professor'];
        const PLACE = ['casa', 'carro', 'parque', 'escola', 'praia', 'piscina', 'médico'];
        let pIdx = -1, lIdx = -1, pWord = '', lWord = '';

        for (let i = 0; i < pictos.length; i++) {
            const w = pictos[i].toLowerCase();
            if (pIdx === -1 && PERSON.includes(w)) { pIdx = i; pWord = pictos[i]; }
            if (lIdx === -1 && PLACE.includes(w)) { lIdx = i; lWord = pictos[i]; }
        }

        if (pIdx !== -1 && lIdx !== -1) {
            if (pIdx < lIdx) {
                return `CRITICAL POSITIONAL CONSTRAINT: In Portuguese, [${pWord}] before [${lWord}] indicates accompaniment: "com o/a ${pWord} para o/ao ${lWord}".`;
            } else {
                return `CRITICAL POSITIONAL CONSTRAINT: In Portuguese, [${lWord}] before [${pWord}] indicates destination/possession: "ao ${lWord} com o/a ${pWord}" or "na casa do/da ${pWord}".`;
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['ontem', 'antes', 'passado'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. Use Portuguese pretérito perfeito (e.g. "ontem fui", "comi").`;
            } else if (['amanhã', 'amanha', 'depois', 'mais tarde'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use future or periphrastic ("amanhã vou").`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['dor', 'doer', 'fome', 'sede', 'sono', 'medo', 'gostar'].includes(p)) {
                return `CRITICAL SENSATION: In Portuguese, bodily sensations use: "estou com dor de cabeça", "dói a cabeça", "estou com fome", "estou com sede", "estou com sono", "gosto de".`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### REGRAS LINGUÍSTICAS PARA PORTUGUÊS (PORTUGUESE AAC RULES):
1. OMISSÃO NATURAL DO SUJEITO (PRO-DROP):
   - Em português omite-se habitualmente o pronome "Eu":
   - [querer] [água] -> "Quero água." (NÃO "Eu quero água").
   - [ir] [parque] -> "Vou ao parque."

2. CONTRAÇÕES OBRIGATÓRIAS:
   - a + o = ao; a + a = à
   - de + o = do; de + a = da
   - em + o = no; em + a = na

3. SENSAÇÕES CORPORAIS E DOR:
   - [dor] [cabeça] -> "Estou com dor de cabeça."
   - [fome] -> "Estou com fome."
   - [sede] -> "Estou com sede."
   - [sono] -> "Estou com sono."

4. PEDIDOS EDUCADOS (MAND):
   - [abrir] [porta] -> "Abre a porta, por favor."
   - [ajuda] -> "Ajuda-me, por favor." (ou "Me ajuda, por favor").
   - [dar] [bolacha] -> "Dá-me uma bolacha, por favor."`;
    }
}

export { PortugueseGrammarProfile };
