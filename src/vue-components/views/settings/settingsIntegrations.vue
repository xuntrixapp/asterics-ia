<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">ARASAAC</h3>
                <div>
                    <input id="activateARASAACGrammarAPI" type="checkbox" v-model="metadata.activateARASAACGrammarAPI" @change="onToggleARASAAC"/>
                    <label for="activateARASAACGrammarAPI">
                        <i18n path="activateAutomaticGrammarCorrectionARASAACAPI" tag="span">
                            <template v-slot:availableLangs>
                                <span>{{util.arrayToPrintable(arasaacService.getSupportedGrammarLangs(true))}}</span>
                            </template>
                        </i18n>
                    </label>
                </div>
                <div class="mt-3">
                    <span class="fa fa-info-circle"></span>
                    <span></span>
                    <i18n path="noteThatActivatingThisSendsSentencesToARASAACSeePrivacy" tag="span">
                        <template v-slot:link>
                            <a v-if="!i18nService.isCurrentAppLangDE()" target="_blank" href="app/privacy_en.html?back=settings#data-transfer">{{ $t('privacyPolicy') }}</a><a v-if="i18nService.isCurrentAppLangDE()" target="_blank" href="app/privacy_de.html?back=settings#data-transfer">{{ $t('privacyPolicy') }}</a>
                        </template>
                    </i18n>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('groq') }}</h3>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 250px;">
                        <input id="activateGroqGrammarAPI" type="checkbox" v-model="metadata.activateGroqGrammarAPI" @change="onToggleGroq" style="margin-bottom: 0;"/>
                        <label for="activateGroqGrammarAPI" style="margin-bottom: 0; display: inline-flex; align-items: center;">
                            <span>{{ $t('activateAutomaticGrammarCorrectionGroqAPI') }}</span>
                        </label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <button 
                            type="button" 
                            class="button button-outline" 
                            style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; font-size: 0.9em; color: #c62828; border-color: #c62828;" 
                            @click="openTutorialWeb"
                            :title="'https://youtu.be/WnodKGtFYP4'"
                        >
                            <i class="fab fa-youtube" style="color: #c62828;"></i>
                            <span>{{ t('groqTutorialBtn') }}</span>
                        </button>
                        <button 
                            type="button" 
                            class="button button-primary" 
                            style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; font-size: 0.9em; background-color: #f55036 !important; border-color: #f55036 !important;" 
                            @click="openGroqWeb"
                            :title="'https://console.groq.com/keys'"
                        >
                            <i class="fas fa-external-link-alt"></i>
                            <span>web Groq</span>
                        </button>
                    </div>
                </div>
                <div class="row mt-2" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <label for="groqApiKey" style="margin-bottom: 0; min-width: 140px;">{{ $t('groqApiKey') }}:</label>
                    <input type="password" id="groqApiKey" style="flex: 1; min-width: 220px; margin-bottom: 0;" v-model="groqApiKey" @input="onGroqApiKeyInput" placeholder="gsk_..."/>
                    <button class="button" style="margin-bottom: 0;" @click="verifyGroqApiKey" :disabled="groqVerifying">
                        <i v-if="groqVerifying" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-check-circle"></i>
                        {{ groqVerifying ? $t('verifyingApiKey') : $t('verifyApiKey') }}
                    </button>
                    <span class="spaced" v-if="groqKeyValid === true" style="color: green;" :title="$t('groqApiKeyValid')">
                        <i class="fas fa-check"/> {{ $t('groqApiKeyValid') }}
                    </span>
                    <span class="spaced" v-if="groqKeyValid === false" style="color: red;" :title="groqKeyError || $t('groqApiKeyInvalid')">
                        <i class="fas fa-times"/> {{ groqKeyError || $t('groqApiKeyInvalid') }}
                    </span>
                </div>
                <div class="row mt-2" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <label for="groqModel" style="margin-bottom: 0; min-width: 140px;">{{ $t('groqModel') }}:</label>
                    <select id="groqModel" v-model="groqModel" @change="onGroqModelChange" style="margin-bottom: 0; min-width: 220px;">
                        <option value="openai/gpt-oss-120b">GPT OSS 120B (Recomendado - Mayor precisión)</option>
                        <option value="openai/gpt-oss-20b">GPT OSS 20B (Rápido)</option>
                    </select>
                </div>
                <div class="row mt-2" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <label for="groqGender" style="margin-bottom: 0; min-width: 140px;">{{ $t('groqGender') }}:</label>
                    <select id="groqGender" v-model="groqGender" @change="onGroqGenderChange" style="margin-bottom: 0; min-width: 220px;">
                        <option value="neutral">{{ $t('groqGenderNeutral') }}</option>
                        <option value="male">{{ $t('groqGenderMale') }}</option>
                        <option value="female">{{ $t('groqGenderFemale') }}</option>
                    </select>
                </div>
                <div class="row mt-2" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <label for="groqComplexity" style="margin-bottom: 0; min-width: 140px;">{{ $t('groqComplexity') }}:</label>
                    <select id="groqComplexity" v-model="groqComplexity" @change="onGroqComplexityChange" style="margin-bottom: 0; min-width: 220px;">
                        <option value="basic">{{ $t('groqComplexityBasic') }}</option>
                        <option value="intermediate">{{ $t('groqComplexityIntermediate') }}</option>
                        <option value="advanced">{{ $t('groqComplexityAdvanced') }}</option>
                    </select>
                </div>
                <div class="row mt-2" style="display: flex; flex-direction: column; gap: 4px;">
                    <label for="groqUserContext" style="margin-bottom: 0; font-weight: bold;">{{ $t('groqUserContext') }}:</label>
                    <textarea id="groqUserContext" v-model="groqUserContext" @input="onGroqUserContextInput" :placeholder="$t('groqUserContextPlaceholder')" rows="3" style="width: 100%; resize: vertical; margin-bottom: 0; font-size: 0.9em; padding: 6px;"></textarea>
                    <small style="color: #666; line-height: 1.3;">{{ $t('groqUserContextHelp') }}</small>
                </div>
                <div class="row mt-3" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding-top: 12px; border-top: 1px dashed #bdbdbd;">
                    <div>
                        <div style="font-weight: bold; font-size: 1.05em; color: #2e7d32;">
                            <i class="fas fa-book" style="margin-right: 6px;"></i>{{ t('groqDictionaryTitle') }}
                        </div>
                        <small style="color: #666;">
                            {{ dictSummaryText }}
                        </small>
                    </div>
                    <button class="button button-primary" style="margin-bottom: 0; display: inline-flex; align-items: center;" @click="showDictionaryModal = true">
                        <i class="fas fa-edit" style="margin-right: 4px;"></i> {{ t('groqOpenDictionary') }}
                    </button>
                </div>
                <div class="mt-3">
                    <span class="fa fa-info-circle"></span>
                    <span>{{ $t('noteThatActivatingGroqSendsSentences') }}</span>
                </div>
            </div>
        </div>
        <h3>{{ $t('externalSpeechService') }}</h3>
        <div class="srow">
            <label class="three columns" for="externalSpeechUrl">{{ $t('externalSpeechUrl') }}</label>
            <input type="text" id="externalSpeechUrl" class="seven columns" v-model="appSettings.externalSpeechServiceUrl" @input="onSpeechUrlInput" placeholder="http://localhost:5555"/>
            <span class="spaced" v-show="urlValid === undefined"><i class="fas fa-spinner fa-spin"/></span>
            <span class="spaced" v-show="urlValid" style="color: green" :title="$t('urlIsValid')"><i class="fas fa-check"/></span>
            <span class="spaced" v-show="urlValid === false" style="color: red" :title="$t('urlIsInvalid')"><i class="fas fa-times"/></span>
        </div>
        <div class="mt-3">
            <span class="fa fa-info-circle"></span>
            <span></span>
            <i18n path="findDetailsAt" tag="span">
                <template v-slot:link>
                    <a target="_blank" href="https://github.com/asterics/Asterics-AAC-Helper?tab=readme-ov-file#speech">{{ $t('infoAboutExternalSpeechService') }}</a>
                </template>
            </i18n>
        </div>
        <h3>Matrix messenger</h3>
        <div class="srow">
            <button @click="currentModal = MODALS.MODAL_MATRIX"><i class="fas fa-cog"></i> {{ $t('configureMatrixMessenger') }}</button>
        </div>
        <configure-matrix v-if="currentModal === MODALS.MODAL_MATRIX" @close="currentModal = null"></configure-matrix>
        <groq-dictionary-modal 
            v-if="showDictionaryModal" 
            :metadata="metadata" 
            @close="showDictionaryModal = false; updateDictionaryCount();"
        ></groq-dictionary-modal>
        <groq-tutorial-modal 
            v-if="showTutorialModal" 
            :metadata="metadata" 
            @close="showTutorialModal = false"
            @open-web="openGroqWeb"
        ></groq-tutorial-modal>
    </div>
</template>

<script>
    import { i18nService, GROQ_EMBEDDED_TRANSLATIONS } from '../../../js/service/i18nService';
    import { util } from '../../../js/util/util';
    import { arasaacService } from '../../../js/service/pictograms/arasaacService';
    import { groqService } from '../../../js/service/groqService';
    import { speechServiceExternal } from '../../../js/service/speechServiceExternal';
    import { speechService } from '../../../js/service/speechService';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import ConfigureMatrix from '../../modals/matrix-messenger/configure-matrix.vue';
    import GroqDictionaryModal from '../../modals/groqDictionaryModal.vue';
    import GroqTutorialModal from '../../modals/groqTutorialModal.vue';

    const MODAL_MATRIX = 'MODAL_MATRIX';
    const MODALS = { MODAL_MATRIX };

    export default {
        components: { ConfigureMatrix, GroqDictionaryModal, GroqTutorialModal },
        props: ["metadata", "userSettingsLocal", "appSettings"],
        mixins: [settingsSaveMixin],
        computed: {
            dictSummaryText() {
                let base = this.t('groqDictionarySummary');
                return (base || '').replace('{count}', this.dictionaryCount);
            }
        },
        data() {
            return {
                showTutorialModal: false,
                i18nService: i18nService,
                util: util,
                arasaacService: arasaacService,
                urlValid: null,
                MODALS: MODALS,
                currentModal: null,
                groqApiKey: '',
                groqModel: 'openai/gpt-oss-120b',
                groqGender: 'neutral',
                groqComplexity: 'intermediate',
                groqUserContext: '',
                showDictionaryModal: false,
                dictionaryCount: 0,
                groqVerifying: false,
                groqKeyValid: null,
                groqKeyError: ''
            }
        },
        methods: {
            async onToggleARASAAC() {
                if (this.metadata.activateARASAACGrammarAPI) {
                    this.metadata.activateGroqGrammarAPI = false;
                    if (this.appSettings) {
                        this.appSettings.activateGroqGrammarAPI = false;
                        await this.saveAppSettings(this.appSettings);
                    }
                }
                await this.saveMetadata(this.metadata);
            },
            async onToggleGroq() {
                if (this.metadata.activateGroqGrammarAPI) {
                    this.metadata.activateARASAACGrammarAPI = false;
                }
                if (this.appSettings) {
                    this.appSettings.activateGroqGrammarAPI = !!this.metadata.activateGroqGrammarAPI;
                    await this.saveAppSettings(this.appSettings);
                }
                await this.saveMetadata(this.metadata);
            },
            async onGroqApiKeyInput() {
                this.groqKeyValid = null;
                this.groqKeyError = '';
                if (this.appSettings) {
                    this.appSettings.groqApiKey = this.groqApiKey;
                    await this.saveAppSettings(this.appSettings);
                }
                if (this.metadata) {
                    this.metadata.groqApiKey = this.groqApiKey;
                    await this.saveMetadata(this.metadata);
                }
            },
            async onGroqModelChange() {
                if (this.appSettings) {
                    this.appSettings.groqModel = this.groqModel;
                    await this.saveAppSettings(this.appSettings);
                }
                if (this.metadata) {
                    this.metadata.groqModel = this.groqModel;
                    await this.saveMetadata(this.metadata);
                }
            },
            async onGroqGenderChange() {
                if (this.appSettings) {
                    this.appSettings.groqGender = this.groqGender;
                    await this.saveAppSettings(this.appSettings);
                }
                if (this.metadata) {
                    this.metadata.groqGender = this.groqGender;
                    await this.saveMetadata(this.metadata);
                }
            },
            async onGroqComplexityChange() {
                if (this.appSettings) {
                    this.appSettings.groqComplexity = this.groqComplexity;
                    await this.saveAppSettings(this.appSettings);
                }
                if (this.metadata) {
                    this.metadata.groqComplexity = this.groqComplexity;
                    await this.saveMetadata(this.metadata);
                }
            },
            async onGroqUserContextInput() {
                if (this.appSettings) {
                    this.appSettings.groqUserContext = this.groqUserContext;
                    await this.saveAppSettings(this.appSettings);
                }
                if (this.metadata) {
                    this.metadata.groqUserContext = this.groqUserContext;
                    await this.saveMetadata(this.metadata);
                }
            },
            async verifyGroqApiKey() {
                if (!this.groqApiKey || !this.groqApiKey.trim()) {
                    this.groqKeyValid = false;
                    this.groqKeyError = this.$t('groqApiKeyEmpty') || 'Clave de API vacía';
                    return;
                }
                this.groqVerifying = true;
                this.groqKeyValid = null;
                this.groqKeyError = '';
                try {
                    let result = await groqService.validateApiKey(this.groqApiKey);
                    this.groqKeyValid = result.valid;
                    if (!result.valid) {
                        this.groqKeyError = result.error;
                    }
                } catch (e) {
                    this.groqKeyValid = false;
                    this.groqKeyError = e.message;
                } finally {
                    this.groqVerifying = false;
                }
            },
            async onSpeechUrlInput() {
                let savedSomething = await this.saveAppSettings(this.appSettings);
                if (savedSomething) {
                    this.urlValid = undefined;
                    this.urlValid = await speechServiceExternal.validateUrl(this.appSettings.externalSpeechServiceUrl);
                    this.urlValid = this.appSettings.externalSpeechServiceUrl ? this.urlValid : null;
                    let timeout = this.urlValid ? 0 : 3000;
                    util.debounce(async () => {
                        await speechService.reinit();
                    }, timeout, 'REINIT_SPEECH');
                }
            },
            openGroqWeb() {
                const url = 'https://console.groq.com/keys';
                if (window.AndroidNative && typeof window.AndroidNative.openUrl === 'function') {
                    window.AndroidNative.openUrl(url);
                } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            },
            openTutorialWeb() {
                const url = 'https://youtu.be/WnodKGtFYP4';
                if (window.AndroidNative && typeof window.AndroidNative.openUrl === 'function') {
                    window.AndroidNative.openUrl(url);
                } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            },
            updateDictionaryCount() {
                this.dictionaryCount = groqService.getDictionaryCount ? groqService.getDictionaryCount() : 0;
            },
            t(key, params) {
                if (this.$te && this.$te(key)) {
                    let val = this.$t(key);
                    if (val && val !== key) {
                        if (params) {
                            Object.keys(params).forEach(p => {
                                val = val.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
                            });
                        }
                        return val;
                    }
                }
                const lang = (i18nService && i18nService.getBaseLang && i18nService.getBaseLang(i18nService.getAppLang())) || 'es';
                const dict = (GROQ_EMBEDDED_TRANSLATIONS && (GROQ_EMBEDDED_TRANSLATIONS[lang] || GROQ_EMBEDDED_TRANSLATIONS.es)) || {};
                let fallback = dict[key] || (GROQ_EMBEDDED_TRANSLATIONS && GROQ_EMBEDDED_TRANSLATIONS.es && GROQ_EMBEDDED_TRANSLATIONS.es[key]) || key;
                if (params) {
                    Object.keys(params).forEach(p => {
                        fallback = fallback.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
                    });
                }
                return fallback;
            }
        },
        async mounted() {
            this.groqApiKey = (this.appSettings && this.appSettings.groqApiKey) || (this.metadata && this.metadata.groqApiKey) || '';
            this.groqModel = (this.appSettings && this.appSettings.groqModel) || (this.metadata && this.metadata.groqModel) || 'openai/gpt-oss-120b';
            this.groqGender = (this.appSettings && this.appSettings.groqGender) || (this.metadata && this.metadata.groqGender) || 'neutral';
            this.groqComplexity = (this.appSettings && this.appSettings.groqComplexity) || (this.metadata && this.metadata.groqComplexity) || 'intermediate';
            this.groqUserContext = (this.appSettings && this.appSettings.groqUserContext) || (this.metadata && this.metadata.groqUserContext) || '';
            this.updateDictionaryCount();
            if (this.metadata && this.metadata.activateGroqGrammarAPI === undefined && this.appSettings && this.appSettings.activateGroqGrammarAPI !== undefined) {
                this.$set(this.metadata, 'activateGroqGrammarAPI', this.appSettings.activateGroqGrammarAPI);
            }
        }
    }
</script>

<style scoped>
    .fa-info-circle {
        color: #266697;
        margin-right: 0.25em;
    }
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
    .spaced {
        margin-left: 0.5em;
    }
</style>