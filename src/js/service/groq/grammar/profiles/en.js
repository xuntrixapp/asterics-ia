import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class EnglishGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('en', 'English');
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';

        const PERSON_WORDS = [
            'dad', 'daddy', 'mom', 'mommy', 'grandpa', 'grandma', 'brother', 'sister', 
            'uncle', 'aunt', 'cousin', 'friend', 'teacher', 'therapist'
        ];

        const POSSESSABLE_PLACES = [
            'house', 'home', 'car', 'room', 'bedroom', 'bed'
        ];

        const PUBLIC_PLACES = [
            'park', 'school', 'playground', 'beach', 'pool', 'zoo', 
            'supermarket', 'store', 'shop', 'cinema', 'hospital', 'doctor'
        ];

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
                return `CRITICAL POSITIONAL CONSTRAINT: The person [${personWord}] appears BEFORE the place [${placeWord}]. This strictly means ACCOMPANIMENT ("with ${personWord} to ${placeWord}"). You MUST NOT say "${placeWord}'s ${personWord}".`;
            } else {
                if (isPossessable) {
                    return `CRITICAL POSITIONAL CONSTRAINT: The place [${placeWord}] appears BEFORE the person [${personWord}]. This strictly means POSSESSION ("to ${personWord}'s ${placeWord}").`;
                } else {
                    return `CRITICAL POSITIONAL CONSTRAINT: The public place [${placeWord}] appears BEFORE the person [${personWord}]. Use: "to the ${placeWord} with ${personWord}".`;
                }
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PAST_MARKERS = ['yesterday', 'before', 'earlier', 'last'];
        const FUTURE_MARKERS = ['tomorrow', 'later', 'soon', 'next'];
        const PRESENT_MARKERS = ['now', 'today'];

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PAST_MARKERS.includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Past-time marker [${pictos[i]}]. You MUST conjugate the verb in PAST tense (e.g. "went", "ate", "played"). NEVER conjugate in present or future.`;
            } else if (FUTURE_MARKERS.includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Future-time marker [${pictos[i]}]. You MUST conjugate in FUTURE tense ("going to [verb]" or "will [verb]").`;
            } else if (PRESENT_MARKERS.includes(p)) {
                return `CRITICAL TEMPORAL CONSTRAINT: Immediate present marker [${pictos[i]}]. Use present tense (e.g. "now I want", "today I am").`;
            }
        }
        return '';
    }

    analyzeSpeechAct(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const REQUEST_VERBS = [
            'open', 'close', 'put', 'take', 'give', 'help', 'turn', 'cut', 'clean', 'tie', 'wait', 'listen'
        ];
        const FIRST_PERSON = ['i', 'me', 'my', 'we', 'us'];

        let hasRequestVerb = false;
        let requestVerbWord = '';
        let hasFirstPerson = false;

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (REQUEST_VERBS.includes(p)) {
                hasRequestVerb = true;
                requestVerbWord = pictos[i];
            }
            if (FIRST_PERSON.includes(p)) {
                hasFirstPerson = true;
            }
        }

        if (hasRequestVerb) {
            if (!hasFirstPerson) {
                return `CRITICAL SPEECH-ACT CONSTRAINT: Action verb [${requestVerbWord}] without "I". This is a polite REQUEST / MAND to the adult. Formulate as: "Please ${requestVerbWord} the [object]" or "Can you ${requestVerbWord} the [object], please?". Do NOT say "I want to ${requestVerbWord}".`;
            } else {
                return `CRITICAL SPEECH-ACT CONSTRAINT: Includes first-person. Formulate as the user's OWN action: "I am going to ${requestVerbWord}..." or "I want to ${requestVerbWord}...".`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const SENSATION_WORDS = [
            'hurt', 'hurts', 'pain', 'ouch', 'hungry', 'thirsty', 'tired', 'sleepy', 'scared', 'cold', 'hot', 'sick'
        ];

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (SENSATION_WORDS.includes(p)) {
                return `CRITICAL SENSATION CONSTRAINT: Contains physical/body state [${pictos[i]}]. In English, use natural idiomatic phrasing: for pain use "My [body part] hurts" (e.g. "My tummy hurts", "My head hurts"), for states use "I am [hungry/tired/cold/thirsty]".`;
            }
        }
        return '';
    }

    analyzeQuantifiersAndNumbers(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PLURALS = [
            'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
            '2', '3', '4', '5', '6', '7', '8', '9', '10', 'many', 'lots', 'some', 'all'
        ];

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PLURALS.includes(p)) {
                return `CRITICAL NUMBER AGREEMENT CONSTRAINT: Quantifier [${pictos[i]}]. The following count noun MUST strictly be in the PLURAL form (e.g. "two cookies", "many toys").`;
            }
        }
        return '';
    }

    getGrammarPillars() {
        return `### ENGLISH AAC LINGUISTIC PILLARS:
1. SUBJECT REQUIREMENT (NO PRO-DROP):
   - In English, sentences MUST have an explicit subject pronoun ("I want", "I like", "We go"). Never omit "I".
   - [want] [water] -> "I want water."
   - [go] [park] -> "I want to go to the park."

2. ADJECTIVE BEFORE NOUN:
   - Adjectives strictly precede the noun:
   - [car] [red] -> "red car" (NEVER "car red").
   - [ball] [big] -> "big ball".

3. ARTICLES & COUNTABLE VS UNCOUNTABLE:
   - Countable: use "a / an" or "the": "a cookie", "an apple", "the toy".
   - Uncountable (water, milk, bread, juice): do NOT use "a": "I want water" (NOT "a water").

4. SENSATIONS & BODY STATES:
   - [hurt] [head] -> "My head hurts."
   - [pain] [tummy] -> "My tummy hurts."
   - [hungry] -> "I am hungry."
   - [thirsty] -> "I am thirsty."

5. POLITE REQUESTS (MANDS):
   - [open] [door] -> "Please open the door." or "Can you open the door, please?"
   - [help] -> "Help me, please."
   - [give] [cookie] -> "Please give me a cookie."

6. QUESTIONS & INTONATION:
   - [where] [mom] -> "Where is mom?"
   - [what] [time] -> "What time is it?"
   - [you] [play] -> "Do you want to play?"

7. ASSERTIVE REFUSAL:
   - [no] [noise] -> "I don't like noise!"
   - [no] [touch] -> "Don't touch me, please."
   - [no] [more] -> "No more, please."

8. FEW-SHOT CONTRAST PAIRS:
   - [go] [mom] [park] => "I am going to the park with mom."
   - [house] [dad] => "Let's go to dad's house."
   - [car] [dad] => "dad's car"
   - [yesterday] [go] [park] => "Yesterday I went to the park."
   - [tomorrow] [go] [doctor] => "Tomorrow I am going to the doctor."
   - [two] [cookie] => "I want two cookies."`;
    }
}

export { EnglishGrammarProfile };
