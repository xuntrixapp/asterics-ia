import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class FrenchGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('fr', 'French');
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';
        const PERSON = ['papa', 'maman', 'frère', 'soeur', 'papi', 'mamie', 'ami', 'maître', 'maîtresse'];
        const PLACE = ['maison', 'voiture', 'parc', 'école', 'plage', 'piscine', 'docteur'];
        let pIdx = -1, lIdx = -1, pWord = '', lWord = '';

        for (let i = 0; i < pictos.length; i++) {
            const w = pictos[i].toLowerCase();
            if (pIdx === -1 && PERSON.includes(w)) { pIdx = i; pWord = pictos[i]; }
            if (lIdx === -1 && PLACE.includes(w)) { lIdx = i; lWord = pictos[i]; }
        }

        if (pIdx !== -1 && lIdx !== -1) {
            if (pIdx < lIdx) {
                return `CRITICAL POSITIONAL CONSTRAINT: In French, [${pWord}] before [${lWord}] indicates accompaniment: "avec ${pWord} à la/au ${lWord}".`;
            } else {
                return `CRITICAL POSITIONAL CONSTRAINT: In French, [${lWord}] before [${pWord}] indicates destination/possession: "au ${lWord} avec ${pWord}" or "la ${lWord} de ${pWord}".`;
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['hier', 'avant', 'passé'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. Use passé composé in French (e.g. "hier je suis allé", "j'ai mangé").`;
            } else if (['demain', 'après', 'plus tard'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use futur proche or simple ("demain je vais aller").`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['mal', 'douleur', 'faim', 'soif', 'sommeil', 'peur'].includes(p)) {
                return `CRITICAL SENSATION: In French, bodily states use avoir: "j'ai faim", "j'ai soif", "j'ai sommeil", "j'ai peur", "j'ai mal à la tête", "j'ai mal au ventre".`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### RÈGLES LINGUISTIQUES POUR LE FRANÇAIS (FRENCH AAC RULES):
1. ÉLISION OBLIGATOIRE:
   - Applique strictement l'élision devant voyelle ou h muet: j'ai, l'eau, l'école, d'accord, c'est.
   - JAMAIS "je ai", "la eau" ou "de accord".

2. ARTICLES PARTITIFS (INCOMPTABLES):
   - Aliments et boissons: du pain, de l'eau, du lait, du chocolat.
   - [vouloir] [eau] -> "Je veux de l'eau." (PAS "un eau").

3. PRONOM SUJET EXPLICITE:
   - Le français exige le pronom sujet ("Je veux", "Je vais").
   - [aller] [parc] -> "Je veux aller au parc."

4. SENSATIONS ET ÉTATS PHYSIQUES:
   - [mal] [tête] -> "J'ai mal à la tête."
   - [mal] [ventre] -> "J'ai mal au ventre."
   - [faim] -> "J'ai faim."
   - [soif] -> "J'ai soif."

5. DEMANDES POLIES (MAND):
   - [ouvrir] [porte] -> "Ouvre la porte, s'il te plaît."
   - [aider] -> "Aide-moi, s'il te plaît."
   - [donner] [biscuit] -> "Donne-moi un biscuit, s'il te plaît."`;
    }
}

export { FrenchGrammarProfile };
