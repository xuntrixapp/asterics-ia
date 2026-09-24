import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

/**
 * Perfil Universal Adaptativo de CAA / SAAC para cualquier idioma soportado.
 * Se autocalibra con el código y nombre del idioma activo, garantizando
 * directivas estrictas de comunicación aumentativa sin interferencias de otros idiomas.
 */
class UniversalProfile extends BaseGrammarProfile {
    constructor(langCode, langName) {
        super(langCode, langName || langCode);
    }

    getGrammarPillars() {
        return `### UNIVERSAL AAC LINGUISTIC PILLARS FOR ${this.langName.toUpperCase()}:
1. FIRST-PERSON VOICE (AAC IDENTITY):
   - Speak directly as the child/user in the first person ("I / me / we"), never narrating in third person unless explicitly specified.

2. POSITIONAL ORDERING & SEMANTIC ROLES:
   - Respect the chronological and positional sequence chosen by the child from left to right.
   - [Place] + [Person]: Respect standard native prepositions for belonging/location.
   - [Person] + [Place]: Standard accompaniment / movement prepositions.

3. POLITE REQUESTS (MAND) VS PERSONAL INTENT:
   - If an action/transitive verb (e.g. open, close, help, give, play) is present WITHOUT the first-person pronoun, formulate as a polite request to the listener in ${this.langName}.
   - If the first-person pronoun is explicitly selected, formulate as the child's own action/will.

4. ACCURATE TEMPORAL CONJUGATION:
   - If past markers are present, conjugate verbs in the past tense.
   - If future/planning markers are present, conjugate in future or intentional periphrastic tense.
   - Default to natural present tense for immediate needs and desires.

5. AFFECTION, SENSATIONS & PHYSICAL STATES:
   - For bodily sensations (pain, cold, hunger, thirst, tiredness, fear), formulate using natural, idiomatic ${this.langName} expressions.

6. QUESTIONS & INTONATION:
   - If question particles are present, formulate as a direct question with correct punctuation and question intonation for TTS.

7. ASSERTIVE REFUSAL / SENSORY OVERLOAD:
   - If "no" or rejection pictograms are present, maintain a clear, firm, assertive refusal to prevent anxiety or distress.

8. NATIVE GRAMMATICAL MORPHOLOGY:
   - Formulate strictly according to the natural syntax, inflections, articles, and word order of ${this.langName}. Do not apply literal translation structures from other languages.`;
    }
}

export { UniversalProfile };
