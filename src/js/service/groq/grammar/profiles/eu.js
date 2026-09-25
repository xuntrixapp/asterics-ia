import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class BasqueGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('eu', 'Basque');
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (['atzo', 'lehen'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past marker [${pictos[i]}]. Use Basque past tense (e.g. "atzo joan nintzen").`;
            } else if (['bihar', 'gero'].includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future marker [${pictos[i]}]. Use Basque future tense (e.g. "bihar joango naiz").`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### EUSKARAZKO ARAU GRAMATIKALAK (BASQUE AAC RULES):
1. HITZEN HURRENKERA (SOV ORDER):
   - Euskaraz aditza perpausaren amaieran kokatzen da normalean (Subjektua - Objektua - Aditza):
   - [ura] [nahi] -> "Ura nahi dut." (URA + NAHI DUT).
   - [parkea] [joan] -> "Parkera joan nahi dut."

2. KASU-MARKA GARRANTZITSUAK:
   - Norabidea (-ra / -era): "parkera", "etxera", "eskolara".
   - Konpainia (-rekin): "aitarekin", "amarekin", "lagunarekin".
   - Leku-genitiboa (-ko / -ren): "aitaren etxea", "amaren autoa".

3. ESKAERA AMATSUAK (MAND):
   - [ireki] [atea] -> "Mesedez, ireki atea."
   - [laguntza] -> "Lagundu, mesedez."
   - [eman] [galleta] -> "Emaidazu galleta bat, mesedez."

4. SENTSASIOAK ETA GORPUTZ EGOERAK:
   - [mina] [burua] -> "Buruko mina dut."
   - [mina] [sabela] -> "Sabeleko mina dut."
   - [gose] -> "Gose naiz."
   - [egarri] -> "Egarri naiz."
   - [lo] -> "Loak nago."`;
    }
}

export { BasqueGrammarProfile };
