/**
 * Clase base para los perfiles gramaticales de idiomas en Groq IA.
 * Cada idioma extiende esta clase implementando sus propias heurísticas y pilares gramaticales.
 */
class BaseGrammarProfile {
    constructor(langCode, langName) {
        this.langCode = langCode || 'en';
        this.langName = langName || 'English';
    }

    /**
     * Analiza relaciones de posición semántica (persona vs lugar, etc.)
     */
    analyzePositionalSemantics(pictos) {
        return '';
    }

    /**
     * Analiza marcadores temporales (pasado, presente, futuro)
     */
    analyzeTemporalContext(pictos) {
        return '';
    }

    /**
     * Analiza actos de habla: Petición (MAND) al interlocutor vs Acción propia
     */
    analyzeSpeechAct(pictos) {
        return '';
    }

    /**
     * Analiza verbos de afección psíquica/física (gustar, doler, sensaciones corporales)
     */
    analyzePsychologicalAndPhysicalVerbs(pictos) {
        return '';
    }

    /**
     * Analiza concordancia de plural tras números o cuantificadores
     */
    analyzeQuantifiersAndNumbers(pictos) {
        return '';
    }

    /**
     * Analiza conectores lógicos (causa, finalidad)
     */
    analyzeConnectors(pictos) {
        return '';
    }

    /**
     * Ejecuta todas las heurísticas y devuelve las restricciones combinadas
     */
    analyzeAll(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';
        const constraints = [
            this.analyzePositionalSemantics(pictos),
            this.analyzeTemporalContext(pictos),
            this.analyzeSpeechAct(pictos),
            this.analyzePsychologicalAndPhysicalVerbs(pictos),
            this.analyzeQuantifiersAndNumbers(pictos),
            this.analyzeConnectors(pictos)
        ].filter(Boolean);
        return constraints.join('\n');
    }

    /**
     * Directiva de concordancia de género del usuario
     */
    getGenderPrompt(gender) {
        if (gender === 'female') {
            return `\n### GENDER & CONCORDANCE (MANDATORY):\n- The speaker is female. Ensure self-referring adjectives, participles and descriptors agree in female gender when applicable.`;
        } else if (gender === 'male') {
            return `\n### GENDER & CONCORDANCE (MANDATORY):\n- The speaker is male. Ensure self-referring adjectives, participles and descriptors agree in male gender when applicable.`;
        }
        return `\n### GENDER & CONCORDANCE:\n- Maintain standard natural and neutral phrasing.`;
    }

    /**
     * Directiva de nivel lingüístico y complejidad
     */
    getComplexityPrompt(complexity) {
        if (complexity === 'basic') {
            return `\n### LINGUISTIC LEVEL: EARLY / INFANTIL (MANDATORY):\n- Short, direct, essential sentences (maximum 3 to 5 words). Avoid complex subordinate clauses.`;
        } else if (complexity === 'advanced') {
            return `\n### LINGUISTIC LEVEL: ADVANCED / FLUENT (MANDATORY):\n- Rich, varied, and fluent sentences with well-formed syntactic structures and precise connectors.`;
        }
        return `\n### LINGUISTIC LEVEL: DAILY / NATURAL (MANDATORY):\n- Natural, everyday spoken sentences with appropriate balance of politeness and clarity.`;
    }

    /**
     * Pilares específicos y reglas de morfología del idioma
     */
    getGrammarPillars() {
        return '';
    }

    /**
     * Construye el system prompt completo exclusivo para este idioma
     */
    buildSystemPrompt(options = {}) {
        const gender = options.gender || 'neutral';
        const complexity = options.complexity || 'intermediate';
        const userContext = options.userContext || '';

        let userContextSection = '';
        if (userContext && userContext.trim()) {
            userContextSection = `\n### USER FAMILIAR ENVIRONMENT & VOCABULARY:\n${userContext.trim()}\n- Use this prior context to interpret family names, pets, therapist names or places naturally.`;
        }

        return `You are an expert Augmentative and Alternative Communication (AAC / SAAC) speech assistant specialized in communication for children with Autism Spectrum Disorder (ASD / TEA).

The child communicates by selecting and placing pictograms in a linear sequence from left to right in ${this.langName} (language code: ${this.langCode}).
Your job is to transform this exact sequence of pictograms into a single natural, everyday spoken sentence, strictly respecting the grammatical relationships defined by the POSITIONAL ORDER and TEMPORAL MARKERS of each pictogram.
${this.getGenderPrompt(gender)}
${this.getComplexityPrompt(complexity)}
${userContextSection}

${this.getGrammarPillars()}

### OUTPUT RULES:
- Return ONLY the final spoken sentence in ${this.langName}.
- NO quotes, NO markdown, NO notes, NO explanations.`;
    }
}

export { BaseGrammarProfile };
