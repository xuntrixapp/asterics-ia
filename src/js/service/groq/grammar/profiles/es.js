import { BaseGrammarProfile } from '../BaseGrammarProfile.js';

class SpanishGrammarProfile extends BaseGrammarProfile {
    constructor() {
        super('es', 'Spanish');
    }

    analyzePositionalSemantics(pictos) {
        if (!Array.isArray(pictos) || pictos.length < 2) return '';

        const PERSON_WORDS = [
            'papá', 'papa', 'mamá', 'mama', 'abuelo', 'abuela', 'hermano', 'hermana', 
            'tío', 'tio', 'tía', 'tia', 'primo', 'prima', 'amigo', 'amiga', 
            'profesor', 'profesora', 'maestro', 'maestra', 'terapeuta', 'logopeda'
        ];

        const POSSESSABLE_PLACES = [
            'casa', 'coche', 'auto', 'habitación', 'habitacion', 'cuarto', 'cama'
        ];

        const PUBLIC_PLACES = [
            'parque', 'colegio', 'cole', 'escuela', 'playa', 'calle', 'plaza', 
            'piscina', 'zoo', 'supermercado', 'tienda', 'cine', 'médico', 'medico', 
            'hospital', 'farmacia'
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
                return `CRITICAL POSITIONAL CONSTRAINT: The person [${personWord}] appears BEFORE the place [${placeWord}]. This strictly means ACCOMPANIMENT ("con ${personWord} a ${placeWord}"). You MUST NOT say "${placeWord} de ${personWord}".`;
            } else {
                if (isPossessable) {
                    return `CRITICAL POSITIONAL CONSTRAINT: The place [${placeWord}] appears BEFORE the person [${personWord}]. This strictly means POSSESSION ("a ${placeWord} de ${personWord}"). You MUST NOT say "con ${personWord}".`;
                } else {
                    return `CRITICAL POSITIONAL CONSTRAINT: The public place [${placeWord}] appears BEFORE the person [${personWord}]. Use: "al ${placeWord} con ${personWord}".`;
                }
            }
        }
        return '';
    }

    analyzeTemporalContext(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PAST_MARKERS = [
            'ayer', 'anteayer', 'anoche', 'antes', 'pasado', 'pasada'
        ];

        const FUTURE_MARKERS = [
            'mañana', 'manana', 'luego', 'después', 'despues', 'pronto', 'tarde', 'próximo', 'proximo'
        ];

        const PRESENT_MARKERS = [
            'ahora', 'ya', 'hoy'
        ];

        let detectedTense = null;
        let markerWord = '';

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PAST_MARKERS.includes(p)) {
                detectedTense = 'past';
                markerWord = pictos[i];
                break;
            } else if (FUTURE_MARKERS.includes(p)) {
                detectedTense = 'future';
                markerWord = pictos[i];
                break;
            } else if (PRESENT_MARKERS.includes(p)) {
                detectedTense = 'present';
                markerWord = pictos[i];
                break;
            }
        }

        if (detectedTense === 'past') {
            return `CRITICAL TEMPORAL CONSTRAINT: The sequence contains the past-time marker [${markerWord}]. You MUST conjugate the main verb in the PAST tense (Pretérito Perfecto Simple or Compuesto, e.g. "fui", "comí", "jugué", "estuve"). NEVER conjugate in present or future.`;
        } else if (detectedTense === 'future') {
            return `CRITICAL TEMPORAL CONSTRAINT: The sequence contains the future-time marker [${markerWord}]. You MUST conjugate the main verb in the FUTURE tense (periphrastic "voy a [verbo]" or future simple "iré", "jugaré"). NEVER conjugate in past tense.`;
        } else if (detectedTense === 'present') {
            return `CRITICAL TEMPORAL CONSTRAINT: The sequence contains the immediate-present marker [${markerWord}]. Conjugate in present tense (e.g. "ahora quiero", "hoy voy").`;
        }
        return '';
    }

    analyzeSpeechAct(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const REQUEST_VERBS = [
            'abrir', 'cerrar', 'poner', 'quitar', 'dar', 'dame', 'ayudar', 'ayuda', 
            'encender', 'apagar', 'subir', 'bajar', 'limpiar', 'atarse', 'vestir', 
            'cortar', 'pelar', 'desatar', 'buscar', 'esperar', 'escuchar'
        ];

        const FIRST_PERSON_PRONOUNS = ['yo', 'mí', 'mi', 'me', 'nosotros', 'nos'];

        let hasRequestVerb = false;
        let requestVerbWord = '';
        let hasFirstPerson = false;

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (REQUEST_VERBS.includes(p)) {
                hasRequestVerb = true;
                requestVerbWord = pictos[i];
            }
            if (FIRST_PERSON_PRONOUNS.includes(p)) {
                hasFirstPerson = true;
            }
        }

        if (hasRequestVerb) {
            if (!hasFirstPerson) {
                return `CRITICAL SPEECH-ACT CONSTRAINT: The action verb [${requestVerbWord}] is NOT accompanied by "yo". This is a polite REQUEST / MAND to the adult/listener. Formulate as an imperative or polite request to the interlocutor (e.g. "Abre la puerta, por favor", "Pon la música, por favor", "Ayúdame, por favor"). Do NOT conjugate as "Quiero abrir" or "Voy a abrir".`;
            } else {
                return `CRITICAL SPEECH-ACT CONSTRAINT: The user explicitly included "yo" with [${requestVerbWord}]. Formulate as the user's OWN intended action in first person (e.g. "Voy a abrir...", "Quiero guardar...").`;
            }
        }
        return '';
    }

    analyzePsychologicalAndPhysicalVerbs(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PSYCH_VERBS = [
            'gustar', 'gusta', 'gustan', 'doler', 'duele', 'duelen', 'dolor', 'encantar', 'encanta', 'encantan', 
            'asustar', 'asusta', 'miedo', 'molestar', 'molesta', 'picar', 'pica', 
            'pupa', 'aburrir', 'aburrido', 'enfadar', 'enfadado', 'apetecer'
        ];

        let foundWord = '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PSYCH_VERBS.includes(p)) {
                foundWord = pictos[i];
                break;
            }
        }

        if (foundWord) {
            return `CRITICAL AFFECTION/SENSATION CONSTRAINT: Contains psychological/physical sensation [${foundWord}]. In Spanish, conjugate with involuntary indirect clitic ("Me gusta / Me gustan", "Me duele / Me duelen", "Me da miedo", "Me pica / Me pican", "Me aburro", "Estoy enfadado/a"). NEVER say "Yo gusto" or "Yo duelo". Ensure strict number agreement with the object.`;
        }
        return '';
    }

    analyzeQuantifiersAndNumbers(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        const PLURAL_QUANTIFIERS = [
            'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
            '2', '3', '4', '5', '6', '7', '8', '9', '10',
            'mucho', 'mucha', 'muchos', 'muchas', 'pocos', 'pocas', 'varios', 'varias',
            'todos', 'todas', 'bastante', 'bastantes'
        ];

        let foundQuantifier = '';
        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (PLURAL_QUANTIFIERS.includes(p)) {
                foundQuantifier = pictos[i];
                break;
            }
        }

        if (foundQuantifier) {
            return `CRITICAL NUMBER AGREEMENT CONSTRAINT: The sequence contains a plural numeral or quantifier [${foundQuantifier}]. In Spanish, the noun that follows MUST be strictly PLURALIZED (e.g. [dos] [galleta] -> "dos galletas", [mucho] [juguete] -> "muchos juguetes"). NEVER leave the noun in singular.`;
        }
        return '';
    }

    analyzeConnectors(pictos) {
        if (!Array.isArray(pictos) || pictos.length === 0) return '';

        let hasPorque = false;
        let hasPara = false;

        for (let i = 0; i < pictos.length; i++) {
            const p = pictos[i].toLowerCase();
            if (p === 'porque') hasPorque = true;
            if (p === 'para') hasPara = true;
        }

        if (hasPorque) {
            return `CRITICAL CONNECTOR CONSTRAINT: Contains [porque]. Formulate as an explanation of cause/reason (e.g. "Lloro porque me duele la mano", "Estoy triste porque se ha roto el juguete").`;
        }
        if (hasPara) {
            return `CRITICAL CONNECTOR CONSTRAINT: Contains [para]. Formulate as a purpose/finality clause (e.g. "un lápiz para dibujar", "agua para lavarme").`;
        }
        return '';
    }

    getGenderPrompt(gender) {
        if (gender === 'female') {
            return `\n### REGLAS DE GÉNERO Y CONCORDANCIA (OBLIGATORIO):\n- El usuario hablante es una NIÑA / MUJER.\n- Todos los adjetivos, participios y expresiones referidas a sí misma deben concordar estrictamente en género FEMENINO.\n- Ejemplos: "estoy contenta", "estoy cansada", "estoy lista", "aburrida", "yo sola", "enfadada".`;
        } else if (gender === 'male') {
            return `\n### REGLAS DE GÉNERO Y CONCORDANCIA (OBLIGATORIO):\n- El usuario hablante es un NIÑO / HOMBRE.\n- Todos los adjetivos, participios y expresiones referidas a sí mismo deben concordar estrictamente en género MASCULINO.\n- Ejemplos: "estoy contento", "estoy cansado", "estoy listo", "aburrido", "yo solo", "enfadado".`;
        }
        return `\n### REGLAS DE GÉNERO Y CONCORDANCIA:\n- Mantener las formas naturales y neutrales según el contexto estándar.`;
    }

    getComplexityPrompt(complexity) {
        if (complexity === 'basic') {
            return `\n### NIVEL LINGÜÍSTICO: INFANTIL / INICIAL (OBLIGATORIO):\n- El usuario está en una etapa inicial de comunicación o es un niño pequeño.\n- Construye oraciones CORTAS, DIRECTAS Y CONCISAS (máximo 3 a 5 palabras).\n- Evita subordinadas complejas o florituras innecesarias.\n- Ejemplos: "Quiero agua", "Voy con papá", "Me duele la barriga", "Voy al parque".`;
        } else if (complexity === 'advanced') {
            return `\n### NIVEL LINGÜÍSTICO: AVANZADO / FLUIDO (OBLIGATORIO):\n- Construye oraciones ricas, variadas y fluidas, con vocabulario preciso y natural, conectores adecuados y oraciones completas bien formadas.`;
        }
        return `\n### NIVEL LINGÜÍSTICO: ESCOLAR / COTIDIANO (OBLIGATORIO):\n- Construye oraciones naturales, completas, espontáneas y cotidianas, con cortesía equilibrada.`;
    }

    getGrammarPillars() {
        return `### PILAR A: MATRIZ DE REGLAS SEMÁNTICAS BASADAS EN CONTEXTO
1. LUGAR POSEÍBLE / OBJETO PERSONAL + PERSONA:
   - Nexo "de" (posesión o pertenencia).
   - [casa] [papá] -> "casa de papá"
   - [coche] [mamá] -> "coche de mamá"
   - [habitación] [hermano] -> "habitación de mi hermano"

2. ACCIÓN + PERSONA + LUGAR:
   - Nexo "con" (compañía antes del destino).
   - [ir] [papá] [casa] -> "Voy con papá a casa."
   - [jugar] [mamá] [parque] -> "Quiero jugar con mamá en el parque."

3. ACCIÓN + LUGAR PÚBLICO + PERSONA:
   - Nexo "con" al final (el lugar público no es posesión de nadie).
   - [ir] [parque] [papá] -> "Voy al parque con papá."
   - [ir] [playa] [abuela] -> "Voy a la playa con la abuela."

4. PERSONA AL INICIO ABSOLUTO:
   - Vocativo / Llamada al adulto para pedir algo.
   - [papá] [agua] -> "Papá, quiero agua."
   - [mamá] [dame] [galleta] -> "Mamá, dame una galleta."

5. COMIDA Y OBJETOS COMPUESTOS:
   - Nexo de composición "de".
   - [zumo] [naranja] -> "zumo de naranja"
   - [galleta] [chocolate] -> "galleta de chocolate"
   - [helado] [fresa] -> "helado de fresa"

6. ESTADOS CORPORALES, SENSACIONES Y DOLOR:
   - Uso de verbos reflexivos o de afección ("me duele", "tengo", "estoy").
   - [yo] [pupa] [cabeza] OR [dolor] [cabeza] -> "Me duele la cabeza."
   - [dolor] [barriga] -> "Me duele la barriga."
   - [yo] [sueño] -> "Tengo sueño."
   - [yo] [hambre] -> "Tengo hambre."
   - [yo] [sed] -> "Tengo sed."
   - [querer] [baño] -> "Quiero ir al baño."

### PILAR B: DETECCIÓN DE PREGUNTAS Y ENTONACIÓN INTERROGATIVA (OBLIGATORIO)
- Si la secuencia contiene partículas interrogativas (dónde, qué, quién, cuándo, por qué, cómo, cuál) o denota una pregunta/petición al interlocutor ([dónde] [mamá], [tú] [querer] [jugar], [qué] [es], [cuándo] [ir]):
  1. Formula la frase OBLIGATORIAMENTE entre signos de interrogación "¿...?".
  2. Esto permite que el sintetizador de voz (TTS) aplique la entonación ascendente de pregunta.
- Ejemplos:
  - Sequence: [dónde] -> [mamá] => "¿Dónde está mamá?"
  - Sequence: [tú] -> [querer] -> [jugar] => "¿Quieres jugar conmigo?"
  - Sequence: [qué] -> [hora] -> [es] => "¿Qué hora es?"
  - Sequence: [cuándo] -> [ir] -> [parque] => "¿Cuándo vamos al parque?"

### PILAR C: REFUERZO DE NEGACIÓN Y RECHAZO ASERTIVO (OBLIGATORIO)
- Para personas con TEA, el rechazo funcional es una herramienta vital para evitar sobrecargas sensoriales o frustración.
- Si la secuencia contiene [no] o expresa rechazo/malestar ([no] [ruido], [no] [tocar], [no] [más], [no] [querer] [dormir]):
  1. Mantén la negación CLARA, FIRME, DIRECTA Y ASERTIVA.
  2. NUNCA la suavices, ni la conviertas en duda o ambigüedad.
- Ejemplos:
  - Sequence: [no] -> [ruido] => "¡No quiero ruido!"
  - Sequence: [no] -> [tocar] => "No me toques, por favor."
  - Sequence: [no] -> [más] => "No quiero más."
  - Sequence: [no] -> [gustar] => "No me gusta."

### PILAR D: EJEMPLOS DE CONTRASTE DIRECTO (FEW-SHOT CONTRAST PAIRS)
- Sequence: [ir] -> [mamá] -> [parque] => "Voy con mamá al parque."
- Sequence: [ir] -> [parque] -> [mamá] => "Voy al parque con mamá."
- Sequence: [casa] -> [papá] => "Vamos a la casa de papá."
- Sequence: [coche] -> [papá] => "el coche de papá"
- Sequence: [papá] -> [abrir] -> [puerta] => "Papá, abre la puerta, por favor."
- Sequence: [abrir] -> [puerta] => "Abre la puerta, por favor."
- Sequence: [yo] -> [abrir] -> [puerta] => "Voy a abrir la puerta."
- Sequence: [zumo] -> [naranja] => "Quiero zumo de naranja."
- Sequence: [galleta] -> [chocolate] => "Quiero una galleta de chocolate."
- Sequence: [ayer] -> [ir] -> [parque] => "Ayer fui al parque."
- Sequence: [ayer] -> [comer] -> [pizza] => "Ayer comí pizza."
- Sequence: [mañana] -> [ir] -> [médico] => "Mañana voy al médico."
- Sequence: [yo] -> [gustar] -> [coche] => "Me gusta el coche."
- Sequence: [yo] -> [gustar] -> [coches] => "Me gustan los coches."
- Sequence: [no] -> [gustar] -> [sopa] => "No me gusta la sopa."
- Sequence: [dolor] -> [barriga] => "Me duele la barriga."
- Sequence: [doler] -> [pies] => "Me duelen los pies."
- Sequence: [tener] -> [hacer] -> [pis] => "Tengo que hacer pis."
- Sequence: [dos] -> [galleta] => "Quiero dos galletas."
- Sequence: [mucho] -> [juguete] => "Tengo muchos juguetes."
- Sequence: [llorar] -> [porque] -> [doler] -> [mano] => "Lloro porque me duele la mano."
- Sequence: [lápiz] -> [para] -> [dibujar] => "Quiero un lápiz para dibujar."
- Sequence: [vamos] -> [jugar] => "¡Vamos a jugar!"
- Sequence: [jugar] -> [juntos] => "Vamos a jugar juntos."

### PILAR E: ROL Y TONO PARA NIÑOS CON TEA
- VOZ EN PRIMERA PERSONA: Habla en nombre del niño/a, usando lenguaje cotidiano, natural y respetuoso.
- NO INVENTAR INFORMACIÓN: No agregues conceptos que el niño no haya puesto.
- COMPLETAR SOLO NEXOS GRAMATICALES: Preposiciones (a, de, con, en, para), artículos (el, la, un, una) y contracciones (al, del).

### PILAR F: NATURALIDAD DEL ESPAÑOL Y OMISIÓN DE PRONOMBRES (PRO-DROP)
- En español coloquial infantil y cotidiano, el pronombre sujeto "Yo" se OMITE de forma natural al conjugar la primera persona, a menos que haya énfasis, contraste o coordinación.
- Ejemplos:
  - [yo] [querer] [agua] => "Quiero agua." (NO "Yo quiero agua")
  - [yo] [ir] [parque] => "Voy al parque." (NO "Yo voy al parque")
  - [yo] [tener] [sueño] => "Tengo sueño." (NO "Yo tengo sueño")
- Mantener "Yo" únicamente en casos de énfasis, contraste o coordinación:
  - [yo] [no] => "¡Yo no!"
  - [yo] [solo] => "Yo solo." (o "Yo sola." según género)
  - [tú] [y] [yo] => "Tú y yo vamos a jugar."

### PILAR G: SUSTANTIVOS CONTABLES VS INCONTABLES (ARTÍCULOS NATURALES)
- INCONTABLES (alimentos líquidos o a granel, estados físicos, sensaciones, emociones):
  - No usar artículos indeterminados "un/una" ni artículos determinados en peticiones estándar.
  - [querer] [agua] => "Quiero agua." (NUNCA "Quiero una agua" ni "Quiero la agua")
  - [querer] [leche] => "Quiero leche."
  - [dame] [pan] => "Dame pan."
  - [tener] [miedo] => "Tengo miedo."
  - [tener] [frío] => "Tengo frío."
- CONTABLES (objetos discretos, juguetes, frutas individuales, cuentos):
  - Emplear artículo indeterminado ("un", "una") o determinado ("el", "la"):
  - [querer] [manzana] => "Quiero una manzana."
  - [dame] [pelota] => "Dame la pelota."
  - [querer] [juguete] => "Quiero un juguete."
  - [leer] [cuento] => "Quiero leer un cuento."

### PILAR H: REGLAS TEMPORALES Y CRONOLÓGICAS (OBLIGATORIO)
- Si la secuencia incluye marcadores de tiempo pasado (ayer, anteayer, anoche, antes):
  - Conjugar el verbo principal OBLIGATORIAMENTE en pretérito perfecto (e.g. "fui", "comí", "jugué"). NUNCA en presente ni en futuro.
  - [ayer] [ir] [parque] => "Ayer fui al parque."
  - [ayer] [comer] [macarrones] => "Ayer comí macarrones."
- Si la secuencia incluye marcadores de tiempo futuro (mañana, luego, después, más tarde):
  - Conjugar el verbo principal en futuro perifrástico ("voy a...") o futuro simple ("iré", "comeremos"). NUNCA en pasado.
  - [mañana] [ir] [médico] => "Mañana voy al médico." o "Mañana voy a ir al médico."
  - [luego] [jugar] [patio] => "Luego vamos a jugar en el patio."
- Si la secuencia incluye marcadores de inmediatez o presente (ahora, ya, hoy):
  - [ahora] [querer] [dibujar] => "Ahora quiero dibujar."
  - [hoy] [estar] [contento] => "Hoy estoy contento."

### PILAR I: PERÍFRASIS VERBALES INFANTILES Y COTIDIANAS (OBLIGATORIO)
- Obligación o necesidad funcional: "tener que + infinitivo" o "necesitar + infinitivo".
  - [tener] [hacer] [pis] => "Tengo que hacer pis."
  - [necesitar] [ir] [baño] => "Necesito ir al baño."
  - [tener] [recoger] [juguetes] => "Tengo que recoger los juguetes."
- Futuro perifrástico natural: "ir a + infinitivo" (en español infantil es 10 veces más común que el futuro simple).
  - [mañana] [ir] [cine] => "Mañana voy a ir al cine." o "Mañana vamos al cine."
- Aspecto durativo / en curso: "estar + gerundio".
  - [yo] [ver] [dibujos] => "Estoy viendo los dibujos."
  - [mamá] [cocinar] => "Mamá está cocinando."
- Terminación de actividad: "ya + terminar de".
  - [ya] [comer] => "Ya he terminado de comer."

### PILAR J: VERBOS DE AFECCIÓN Y ESTRUCTURA INVERSA (TIPO GUSTAR, DOLER, ENCANTAR)
- En español estos verbos exigen pronombre clítico involuntario ("me", "te", "nos") y el verbo concuerda en número con el OBJETO, nunca con la persona.
- NUNCA digas "Yo gusto" o "Yo duelo".
- Ejemplos:
  - [yo] [gustar] [coche] => "Me gusta el coche."
  - [yo] [gustar] [coches] => "Me gustan los coches." (concordancia en plural: "los coches" -> "gustan").
  - [no] [gustar] [sopa] => "No me gusta la sopa."
  - [yo] [encantar] [chocolate] => "Me encanta el chocolate."
  - [dolor] [ojos] => "Me duelen los ojos."
  - [asustar] [perro] OR [miedo] [perro] => "Me da miedo el perro."
  - [aburrir] => "Me aburro." o "Estoy aburrido."
  - [enfadar] [hermano] => "Estoy enfadado con mi hermano."

### PILAR K: PETICIÓN AL ADULTO (IMPERATIVO CORTÉS) VS ACCIÓN PROPIA
- Si la secuencia contiene un verbo transitivo de acción (abrir, cerrar, poner, quitar, dar, dame, ayudar, encender, apagar, limpiar, atar, cortar) y NO contiene el pronombre "yo":
  - Se interpreta obligatoriamente como una PETICIÓN / MAND al interlocutor para que realice la acción.
  - [abrir] [puerta] => "Abre la puerta, por favor." o "¿Puedes abrir la puerta?"
  - [poner] [música] => "Pon la música, por favor."
  - [quitar] [zapatos] => "Quítame los zapatos, por favor."
  - [dar] [galleta] OR [dame] [galleta] => "Dame una galleta, por favor."
  - [ayuda] OR [ayudar] => "Ayúdame, por favor."
- Si la secuencia CONTIENE explícitamente "yo":
  - Es una acción propia:
  - [yo] [abrir] [puerta] => "Voy a abrir la puerta."
  - [yo] [guardar] [juguete] => "Voy a guardar mi juguete."

### PILAR L: PLURALIZACIÓN TRAS NÚMEROS Y CUANTIFICADORES
- En CAA los pictogramas de sustantivos suelen estar en singular léxico base (ej. "galleta", "coche").
- Si van precedidos de un número cardinal mayor que 1 (dos, tres, cuatro...) o de cuantificadores (muchos, varios, todos):
  - El sustantivo DEBE PLURALIZARSE rigurosamente:
  - [dos] [galleta] => "dos galletas" (NUNCA "dos galleta").
  - [tres] [coche] => "tres coches".
  - [mucho] [juguete] => "muchos juguetes".
  - [todo] [pieza] => "todas las piezas".

### PILAR M: CONECTORES LÓGICOS DE CAUSA Y FINALIDAD
- Causa ("porque"):
  - [llorar] [porque] [doler] [mano] => "Lloro porque me duele la mano."
  - [triste] [porque] [romper] [juguete] => "Estoy triste porque se ha roto el juguete."
  - [enfadado] [porque] [no] [jugar] => "Estoy enfadado porque no me dejas jugar."
- Finalidad ("para"):
  - [lápiz] [para] [dibujar] => "Quiero un lápiz para dibujar."
  - [tijeras] [para] [cortar] => "Quiero las tijeras para cortar."
  - [agua] [para] [beber] => "Quiero agua para beber."

### PILAR N: CONTRACCIONES OBLIGATORIAS Y ALTERNANCIAS FONÉTICAS
- Contracciones normativas del español:
  - a + el = al -> [ir] [parque] => "Voy al parque." (NUNCA "a el parque").
  - de + el = del -> [salir] [colegio] => "Salgo del colegio." (NUNCA "de el colegio").
- Alternancias fonéticas de conjunciones:
  - Cambiar "y" por "e" si la siguiente palabra empieza por el sonido [i]: "padre e hijo", "mamá e Irene".
  - Cambiar "o" por "u" si la siguiente palabra empieza por el sonido [o]: "siete u ocho".

### PILAR O: INCLUSIÓN COOPERATIVA (1ª PERSONA PLURAL)
- Si la secuencia expresa juego compartido o salida colectiva con el interlocutor:
  - [vamos] [jugar] => "¡Vamos a jugar!"
  - [jugar] [juntos] => "Vamos a jugar juntos."
  - [nosotros] [parque] => "Vamos juntos al parque."`;
    }
}

export { SpanishGrammarProfile };
