import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GroqPhrase extends Model({
    id: String,
    userId: [String],
    modelName: String,
    modelVersion: String,
    phraseKey: String,
    rawText: [String],
    sentence: String,
    lang: [String],
    gender: [String],
    complexity: [String],
    model: [String],
    userContext: [String],
    timestamp: [Number],
    deleted: [Boolean],
    deletedAt: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GroqPhrase);
        super(properties);
        this.id = this.id || modelUtil.generateId(GroqPhrase.getIdPrefix());
    }

    static getModelName() {
        return 'GroqPhrase';
    }

    static getIdPrefix() {
        return 'groqphrase';
    }
}

GroqPhrase.defaults({
    id: '', // will be replaced by constructor
    userId: '',
    modelName: GroqPhrase.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    phraseKey: '',
    rawText: '',
    sentence: '',
    timestamp: 0,
    deleted: false,
    deletedAt: 0
});

export { GroqPhrase };
