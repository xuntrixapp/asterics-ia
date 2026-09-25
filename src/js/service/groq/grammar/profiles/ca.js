import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class CatalanGrammarProfile extends BaseGrammarProfile {
    constructor(langCode = 'ca', langName = 'Catalan') {
        super(langCode, langName);
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';

        const PERSON_WORDS = [
            'pare', 'papa', 'mare', 'mama', 'avi', 'àvia', 'germà', 'germana', 
            'oncle', 'tia', 'cosí', 'cosina', 'amic', 'amiga', 'mestre', 'mestra', 'terapeuta'
        ];

        const POSSESSABLE_PLACES = ['casa', 'cotxe', 'habitació', 'cambra', 'llit'];
        const PUBLIC_PLACES = ['parc', 'escola', 'col·legi', 'platja', 'carrer', 'plaça', 'piscina', 'zoo', 'metge', 'hospital'];

        let personIdx = -1;
        let placeIdx = -1;
        let personWord = '';
        let placeWord = '';
        let isPossessable = false;

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (personIdx === -1 && PERSON_WORDS.includes(p)) {
                personIdx = i;
                personWord = pictos[i];
            }
            if (placeIdx === -1) {
                if (POSSESSABLE_PLACES.includes(p)) {
                    placeIdx = i;
                    placeWord = pictos[i];
                    isPossessable = true;
                } else if (PUBLIC_PLACES.includes(p)) {
                    placeIdx = i;
                    placeWord = pictos[i];
                    isPossessable = false;
                }
            }
        }

        if (personIdx !== -1 && placeIdx !== -1) {
            if (personIdx < placeIdx) {
                return `CRITICAL POSITIONAL CONSTRAINT: [${personWord}] appears before [${placeWord}]. In Catalan, this indicates company: "amb el/la ${personWord} a ${placeWord}". NEVER say "${placeWord} de ${personWord}".`;
            } else {
                if (isPossessable) {
                    return `CRITICAL POSITIONAL CONSTRAINT: [${placeWord}] appears before [${personWord}]. In Catalan, this indicates possession: "a la ${placeWord} del/de la ${personWord}".`;
                } else {
                    return `CRITICAL POSITIONAL CONSTRAINT: [${placeWord}] before [${personWord}]. Public place: "al ${placeWord} amb el/la ${personWord}".`;
                }
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PAST_MARKERS = ['ahir', 'abans', 'passat', 'anit'];
        const FUTURE_MARKERS = ['demà', 'després', 'aviat', 'tard', 'proper'];
        const PRESENT_MARKERS = ['ara', 'avui'];

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PAST_MARKERS.includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. In Catalan, use standard past periphrastic (e.g. "ahir vaig anar", "ahir vaig menjar"). NEVER present or future.`;
            } else if (FUTURE_MARKERS.includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use future tense or intentional periphrasis (e.g. "demà aniré", "vaig a anar").`;
            } else if (PRESENT_MARKERS.includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Present marker [${pictos[i]}]. Use present tense ("ara vull", "avui estic").`;
            }
        }
        return '';
    }

    analyzeSpeechAct(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const REQUEST_VERBS = ['obrir', 'tancar', 'posar', 'treure', 'donar', 'dóna', 'ajudar', 'ajuda', 'esperar', 'escoltar'];
        const FIRST_PERSON = ['jo', 'mi', 'em', 'nosaltres', 'ens'];

        let hasRequest = false;
        let reqWord = '';
        let hasFirst = false;

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (REQUEST_VERBS.includes(p)) {
                hasRequest = true;
                reqWord = pictos[i];
            }
            if (FIRST_PERSON.includes(p)) {
                hasFirst = true;
            }
        }

        if (hasRequest) {
            if (!hasFirst) {
                return `CRITICAL SPEECH-ACT: Action verb [${reqWord}] without "jo". Polite REQUEST / MAND in Catalan: "Obre la porta, si us plau", "Ajuda'm, per favor", "Posa la música, si us plau". Do NOT say "Vull obrir".`;
            } else {
                return `CRITICAL SPEECH-ACT: Own action: "Vaig a ${reqWord}..." or "Vull ${reqWord}...".`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PSYCH = ['agradar', 'agrada', 'dolor', 'mal', 'por', 'son', 'gana', 'set', 'avorrir'];
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PSYCH.includes(p)) {
                return `CRITICAL SENSATION CONSTRAINT: Bodily state or sensation [${pictos[i]}]. In Catalan, use standard clitics/idioms: "em fa mal el cap", "em fa mal la panxa", "m'agrada", "tinc gana", "tinc set", "tinc por". NEVER "jo faig mal".`;
            }
        }
        return '';
    }

    analyzeQuantifiersAndNumbers(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        const PLURALS = ['dos', 'dues', 'tres', 'quatre', 'cinc', '2', '3', '4', 'molt', 'molts', 'moltes', 'tots', 'totes'];
        for (let i = 0; i < pictos.length; i++) {
            if (PLURALS.includes(pictos[i].toLowerCase())) {
                return `CRITICAL NUMBER AGREEMENT: Quantifier [${pictos[i]}]. The count noun MUST strictly be PLURAL in Catalan (e.g. "dues galetes", "molts joguets").`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### REGLAS LINGÜÍSTICAS PARA CATALÁN / VALENCIANO:
1. APOSTROFACIÓ OBLIGATÒRIA:
   - Aplica rigurosamente las reglas de apostrofación: l'aigua, l'escola, l'amic, d'ahir, d'un, m'agrada, t'ajudo.
   - NUNCA escribas "la aigua", "de ahir" o "me agrada".

2. CONTRACCIONS NORMATIVES:
   - a + el = al (al parc)
   - de + el = del (del pare)
   - per + el = pel (pel carrer)
   - a + els = als (als nens)
   - de + els = dels (dels amics)

3. CLÍTICS PRONOMINALS PER A SENSACIONS I DOLOR:
   - [mal] [cap] -> "Em fa mal el cap."
   - [dolor] [panxa] -> "Em fa mal la panxa."
   - [jo] [agradar] [cotxe] -> "M'agrada el cotxe."
   - [gana] -> "Tinc gana."
   - [set] -> "Tinc set."

4. OMISSIÓ NATURAL DEL SUBJECTE (PRO-DROP):
   - Al igual que en español, omite "jo" de manera natural:
   - [voler] [aigua] -> "Vull aigua." (NO "Jo vull aigua").
   - [anar] [parc] -> "Vaig al parc."

5. PETICIONS CORTESES (MAND):
   - [obrir] [porta] -> "Obre la porta, si us plau."
   - [ajudar] -> "Ajuda'm, per favor."
   - [donar] [galeta] -> "Dóna'm una galeta, si us plau."

6. EXEMPLES FEW-SHOT EN CATALÀ:
   - [anar] [mare] [parc] => "Vaig al parc amb la mare."
   - [casa] [pare] => "Anem a casa del pare."
   - [ahir] [anar] [parc] => "Ahir vaig anar al parc."
   - [demà] [anar] [metge] => "Demà vaig al metge."
   - [dos] [galeta] => "Vull dues galetes."
   - [no] [soroll] => "¡No vull soroll!"`;
    }
}

export { CatalanGrammarProfile };
