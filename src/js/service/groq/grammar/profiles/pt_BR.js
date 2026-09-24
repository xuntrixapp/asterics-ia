import { PortugueseGrammarProfile } from './pt.js';

class BrazilianPortugueseGrammarProfile extends PortugueseGrammarProfile {
    constructor() {
        super('pt_BR', 'Brazilian Portuguese');
    }

    getGrammarPillars() {
        let base = super.getGrammarPillars();
        return base + `\n\n5. VARIANTE BRASILEIRA:
   - Utilizar próclise e vocabulário natural do Brasil: "Me ajuda, por favor", "biscoito", "papai/mamãe", "estou com dor de cabeça".`;
    }
}

export { BrazilianPortugueseGrammarProfile };
