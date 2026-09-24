import { CatalanGrammarProfile } from './ca.js';

class ValencianGrammarProfile extends CatalanGrammarProfile {
    constructor() {
        super('val', 'Valencian');
    }

    getGrammarPillars() {
        let base = super.getGrammarPillars();
        return base + `\n\n7. VARIANT VALENCIANA:
   - Utilitza preferentment formes valencianes naturals: "per favor", "este/esta", "ací", "xiquet/xiqueta", "joguets".`;
    }
}

export { ValencianGrammarProfile };
