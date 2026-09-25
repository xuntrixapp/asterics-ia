import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class GermanGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('de', 'German');
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['gestern', 'vorher'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. Use German Perfekt (e.g. "gestern bin ich gegangen", "ich habe gegessen").`;
            } else if (['morgen', 'später', 'bald'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use Futur or present with time indicator ("morgen gehe ich").`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['weh', 'schmerz', 'hunger', 'durst', 'müde', 'angst'].includes(p)) {
                return `CRITICAL SENSATION: In German, bodily states use: "mir tut der Kopf weh", "mir tut der Bauch weh", "ich habe Hunger", "ich habe Durst", "ich bin müde", "ich habe Angst".`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### DEUTSCHE SPRACHREGELN FÜR UK/AAC (GERMAN AAC RULES):
1. VERBSTEUERUNG UND MODALVERBEN:
   - Kindliche Wünsche natürlich mit "ich möchte" oder "ich will":
   - [Wasser] [wollen] -> "Ich möchte Wasser."
   - [Park] [gehen] -> "Ich möchte in den Park gehen."

2. TRENNBARE VERBEN:
   - Bei Aufforderungen das Präfix ans Satzende stellen:
   - [aufmachen] [Tür] -> "Mach bitte die Tür auf."
   - [anmachen] [Musik] -> "Mach bitte die Musik an."

3. KÖRPERLICHE EMPFINDUNGEN UND SCHMERZ:
   - [Kopf] [weh] -> "Mir tut der Kopf weh."
   - [Bauch] [weh] -> "Mir tut der Bauch weh."
   - [Hunger] -> "Ich habe Hunger."
   - [Durst] -> "Ich habe Durst."

4. HÖFLICHE BITTEN (MAND):
   - [Tür] [aufmachen] -> "Mach bitte die Tür auf."
   - [Hilfe] -> "Hilf mir bitte."
   - [Keks] [geben] -> "Gib mir bitte einen Keks."`;
    }
}

export { GermanGrammarProfile };
