<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('gridContentLanguage') }}</h3>
                <div class="srow">
                    <label class="three columns" for="contentLang">{{ $t('selectLanguage') }}</label>
                    <select class="five columns mb-2" id="contentLang" v-model="userSettingsLocal.contentLang" @change="saveUserSettings()">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="lang in selectLanguages" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                    <div class="four columns">
                        <input id="selectAllLanguages" type="checkbox" v-model="selectAllLanguages" @change="showAllLangsChanged()"/>
                        <label for="selectAllLanguages">{{ $t('showAllLanguages') }}</label>
                    </div>
                </div>
                <div class="srow">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word">
                        {{ $t('gridsCanBeTranslatedToEveryLanguage') }}
                    </span>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('voice') }}</h3>

                <!-- 1. Selector de Motor TTS (Exclusivo: Estándar vs Kokoro TTS) -->
                <div class="srow mb-3">
                    <label class="three columns">{{ $t('ttsEngine') || 'Motor de voz' }}</label>
                    <div class="eight columns d-flex align-items-center gap-4 flex-wrap">
                        <div class="d-inline-flex align-items-center gap-2 engine-option">
                            <input type="radio" id="engineStandard" value="standard" v-model="userSettingsLocal.voiceConfig.ttsEngine" @change="onTtsEngineChange('standard')"/>
                            <label for="engineStandard" class="mb-0 cursor-pointer">
                                <strong>🔊 {{ $t('ttsEngineStandard') || 'Voz del sistema / Estándar' }}</strong>
                            </label>
                        </div>
                        <div class="d-inline-flex align-items-center gap-2 engine-option">
                            <input type="radio" id="engineKokoro" value="kokoro" v-model="userSettingsLocal.voiceConfig.ttsEngine" @change="onTtsEngineChange('kokoro')"/>
                            <label for="engineKokoro" class="mb-0 cursor-pointer">
                                <strong>🧠 {{ $t('ttsEngineKokoro') || 'Kokoro TTS (Voz Neural)' }}</strong>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 2A. Selector de Voz para Motor Estándar -->
                <div class="srow" v-if="!isKokoroEngine">
                    <label class="three columns" for="inVoice">
                        <span>{{ $t('preferredVoice') }}</span>
                    </label>
                    <select id="inVoice" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.preferredVoice" @change="resetVoiceProps(); saveUserSettings()">
                        <option :value="undefined">{{ $t('automatic') }}</option>
                        <option v-for="voice in selectVoices" :value="voice.id">
                            <span>{{ getVoiceDisplayText(voice, selectAllVoices) }}</span>
                        </option>
                    </select>
                    <div class="four columns">
                        <input id="selectAllVoices" type="checkbox" v-model="selectAllVoices" @change="showAllVoicesChanged()"/>
                        <label for="selectAllVoices">{{ $t('showAllVoices') }}</label>
                    </div>
                </div>

                <!-- 2B. Selector de Voz para Motor Kokoro TTS -->
                <div class="srow" v-if="isKokoroEngine">
                    <label class="three columns" for="inKokoroVoice">
                        <span>{{ $t('kokoroVoice') || 'Voz Kokoro' }}</span>
                    </label>
                    <select id="inKokoroVoice" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.kokoroVoice" @change="saveUserSettings()">
                        <option :value="undefined">{{ $t('automatic') }} ({{ getKokoroDefaultVoiceName }})</option>
                        <option v-for="kv in selectKokoroVoices" :value="kv.id">
                            <span>{{ kv.name }}</span>
                        </option>
                    </select>
                    <div class="four columns">
                        <input id="selectAllKokoroVoices" type="checkbox" v-model="selectAllVoices" @change="showAllVoicesChanged()"/>
                        <label for="selectAllKokoroVoices">{{ $t('showAllVoices') }}</label>
                    </div>
                </div>

                <!-- 3. Prueba de Voz -->
                <div class="srow">
                    <label class="three columns" for="testText">
                        <span>{{ $t('testText') }}</span>
                    </label>
                    <input id="testText" class="five columns" type="text" v-model="testText">
                    <button id="testVoice" class="three columns" @click="testSpeak">{{ $t('test') }}</button>
                </div>

                <!-- 4. Opciones Avanzadas de Voz -->
                <div class="srow">
                    <accordion :acc-label="$t('advancedVoiceSettings')" class="eleven columns">
                        <div>
                            <slider-input :label="$t('voicePitch')" id="voicePitch" min="0.1" max="2" step="0.1" decimals="1" v-model.number="userSettingsLocal.voiceConfig.voicePitch" @change="saveUserSettings()"/>
                            <slider-input :label="$t('voiceRate')" id="voiceRate" min="0.1" max="10" step="0.1" decimals="1" v-model.number="userSettingsLocal.voiceConfig.voiceRate" @change="saveUserSettings()"/>
                        </div>

                        <!-- Sección de Ajustes Avanzados y Almacenamiento para Kokoro TTS -->
                        <div v-if="isKokoroEngine" class="kokoro-advanced-card p-3 my-3">
                            <h5 class="fw-bold mb-2">🧠 {{ $t('kokoroStorageTitle') || 'Almacenamiento Local de Audios Kokoro' }}</h5>
                            <div class="small text-muted mb-3">
                                {{ $t('kokoroStorageDesc') || 'Los audios se guardan en la memoria local para reproducirse al instante (0 ms de retardo) y funcionar sin conexión en dispositivos móviles.' }}
                            </div>

                            <!-- Límite de almacenamiento elegible (Por defecto 500 MB) -->
                            <slider-input
                                :label="$t('kokoroStorageLimit') || 'Límite de almacenamiento asignado'"
                                unit="MB"
                                id="kokoroCacheLimit"
                                min="50"
                                max="2000"
                                step="50"
                                v-model.number="userSettingsLocal.voiceConfig.kokoroCacheLimitMb"
                                @change="onKokoroCacheLimitChange"/>

                            <!-- Estadísticas de uso en tiempo real -->
                            <div class="srow d-flex align-items-center justify-content-between mb-3 flex-wrap">
                                <div>
                                    <strong>{{ $t('kokoroCacheUsage') || 'Espacio utilizado' }}:</strong>
                                    <span class="badge bg-primary text-white ms-2 px-2 py-1">{{ kokoroCacheStats.sizeMb }} MB / {{ userSettingsLocal.voiceConfig.kokoroCacheLimitMb || 500 }} MB</span>
                                    <span class="text-muted ms-2">({{ kokoroCacheStats.count }} {{ $t('cachedPhrases') || 'frases en disco' }})</span>
                                </div>
                            </div>

                            <!-- Botones de Acción de Almacenamiento -->
                            <div class="srow d-flex flex-wrap gap-2">
                                <button type="button" class="btn btn-outline-primary d-inline-flex align-items-center gap-1" @click="precacheCurrentGridKokoro" :disabled="kokoroPrecacheProgress !== undefined && kokoroPrecacheProgress !== 100">
                                    <i class="fas fa-download"></i>
                                    <span>{{ $t('precacheCurrentBoard') || 'Pre-cachear tablero actual' }}</span>
                                    <span v-if="kokoroPrecacheProgress !== undefined"> ({{ kokoroPrecacheProgress }}%)</span>
                                </button>
                                <button type="button" class="btn btn-outline-danger d-inline-flex align-items-center gap-1" @click="clearKokoroCache">
                                    <i class="fas fa-trash-alt"></i>
                                    <span>{{ $t('clearKokoroCache') || 'Vaciar caché de audios' }}</span>
                                </button>
                            </div>

                            <!-- URL de servidor Kokoro personalizada (opcional) -->
                            <div class="srow mt-3">
                                <label class="four columns" for="kokoroServerUrl">{{ $t('kokoroServerUrl') || 'Servidor Kokoro TTS' }}</label>
                                <input id="kokoroServerUrl" class="eight columns" type="text"
                                       v-model="userSettingsLocal.voiceConfig.kokoroServerUrl"
                                       :placeholder="defaultKokoroEndpoint"
                                       @change="saveUserSettings()"/>
                            </div>
                        </div>

                        <div class="srow" v-if="!isKokoroEngine">
                            <label class="three columns" for="inVoice2">
                                <span>{{ $t('secondVoice') }}</span>
                            </label>
                            <select id="inVoice2" class="five columns mb-2" v-model="userSettingsLocal.voiceConfig.secondVoice" @change="saveUserSettings()">
                                <option :value="undefined">{{ $t('noneSelected') }}</option>
                                <option v-for="voice in voices" :value="voice.id">
                                    <span>{{ getVoiceDisplayText(voice, true) }}</span>
                                </option>
                            </select>
                            <button id="testVoice2" class="three columns" :disabled="!userSettingsLocal.voiceConfig.secondVoice" @click="speechService.testSpeak(userSettingsLocal.voiceConfig.secondVoice)">{{ $t('test') }}</button>
                        </div>
                        <div class="srow">
                            <input id="voiceLangIsTextLang" type="checkbox" v-model="userSettingsLocal.voiceConfig.voiceLangIsTextLang" @change="saveUserSettings()"/>
                            <label for="voiceLangIsTextLang">{{ $t('linkVoiceLanguageToTranslationLanguageOfSpokenText') }}</label>
                        </div>
                        <div class="srow">
                            <input id="waitForSpeechToFinish" type="checkbox" v-model="userSettingsLocal.voiceConfig.waitForSpeechToFinish" @change="saveUserSettings()"/>
                            <label for="waitForSpeechToFinish">{{ $t('waitForSpeechToFinish') }}</label>
                        </div>
                        <div class="srow" v-show="!isKokoroEngine && !!speechService.getExternalVoice(userSettingsLocal.voiceConfig.preferredVoice)">
                            <button @click="cacheAll()" :disabled="externalVoiceCacheProgress !== undefined && externalVoiceCacheProgress !== 100">{{ $t('cacheAllTextsOfCurrentConfigurationExternalVoice') }}</button>
                            <span v-show="externalVoiceCacheProgress !== undefined"> ... {{ externalVoiceCacheProgress }}%</span>
                        </div>
                    </accordion>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('progressiveLanguage') }}</h3>
                <div class="srow">
                    <label class="three columns" for="langLevel">
                        <span>{{ $t('shownVocabularyLevel') }}</span>
                    </label>
                    <select id="langLevel" class="five columns mb-2" v-model="metadata.vocabularyLevel" @change="saveMetadata(metadata)">
                        <option :value="null">{{ $t('showAllElements') }}</option>
                        <option v-for="level in [...Array(10).keys()].map(i => i + 1)" :value="level">{{ $t('untilLevel', { level: level}) }}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService";
    import {dataService} from "../../../js/service/data/dataService";
    import {localStorageService} from "../../../js/service/data/localStorageService";
    import {speechService} from "../../../js/service/speechService";
    import {kokoroService, KOKORO_VOICES, DEFAULT_KOKORO_ENDPOINT} from "../../../js/service/kokoroService";
    import {speechServiceExternal} from "../../../js/service/speechServiceExternal.js";
    import {stateService} from "../../../js/service/stateService";
    import {util} from "../../../js/util/util";
    import { gridUtil } from '../../../js/util/gridUtil';
    import {constants} from "../../../js/util/constants.js";
    import { settingsSaveMixin } from './settingsSaveMixin';
    import Accordion from "../../components/accordion.vue";
    import SliderInput from '../../modals/input/sliderInput.vue';
    import $ from '../../../js/externals/jquery';

    let KEY_SETTINGS_SHOW_ALL_VOICES = "KEY_SETTINGS_SHOW_ALL_VOICES";
    let KEY_SETTINGS_SHOW_ALL_CONTENTLANGS = "KEY_SETTINGS_SHOW_ALL_CONTENTLANGS";

    export default {
        components: { SliderInput, Accordion},
        props: ["userSettingsLocal", "metadata"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                show: false,
                selectAllLanguages: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS)) || false,
                selectAllVoices: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_VOICES)) || false,
                gridLanguages: [],
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getAppLang(),
                saveSuccess: null,
                speechService: speechService,
                kokoroService: kokoroService,
                voices: [],
                selectVoices: [],
                defaultKokoroEndpoint: DEFAULT_KOKORO_ENDPOINT,
                kokoroCacheStats: { count: 0, sizeBytes: 0, sizeMb: '0.00', maxMb: 500 },
                kokoroPrecacheProgress: undefined,
                validSpeechServiceUrl: null,
                externalVoiceCacheProgress: undefined,
                testText: i18nService.t('thisIsAnEnglishSentence'),
                i18nService: i18nService,
                localStorageService: localStorageService,
                constants: constants,
                util: util,
                lastSavedSettingsString: JSON.stringify(this.userSettingsLocal)
            }
        },
        computed: {
            selectLanguages() {
                if (!this.allLanguages || !this.gridLanguages) {
                    return []
                }
                if (this.selectAllLanguages) {
                    return this.allLanguages;
                }
                return this.allLanguages.filter(langObject => this.gridLanguages.includes(langObject.code));
            },
            isKokoroEngine() {
                return this.userSettingsLocal &&
                       this.userSettingsLocal.voiceConfig &&
                       this.userSettingsLocal.voiceConfig.ttsEngine === constants.TTS_ENGINE_KOKORO;
            },
            selectKokoroVoices() {
                if (this.selectAllVoices) {
                    return KOKORO_VOICES;
                }
                let curLang = i18nService.getContentLangBase();
                let filtered = kokoroService.getVoices(curLang);
                return filtered.length > 0 ? filtered : KOKORO_VOICES;
            },
            getKokoroDefaultVoiceName() {
                let curLang = i18nService.getContentLang();
                let defId = kokoroService.getDefaultVoiceForLang(curLang);
                let v = kokoroService.getVoiceById(defId);
                return v ? v.name : defId;
            }
        },
        methods: {
            saveUserSettings() {
                if (JSON.stringify(this.userSettingsLocal) === this.lastSavedSettingsString) {
                    return;
                }
                this.$emit("changing");
                util.debounce(() => {
                    this.saveUserSettingsLocal(this.userSettingsLocal, 0); // method from mixin
                    this.lastSavedSettingsString = JSON.stringify(this.userSettingsLocal);
                    this.selectVoices = this.getSelectVoices();
                    this.fixCurrentVoice(true);
                    this.setVoiceTestText();
                }, 300, 'SAVE_USERSETTINGS');
            },
            onTtsEngineChange(engine) {
                if (!this.userSettingsLocal.voiceConfig) {
                    this.userSettingsLocal.voiceConfig = {};
                }
                this.userSettingsLocal.voiceConfig.ttsEngine = engine;
                if (engine === constants.TTS_ENGINE_KOKORO && !this.userSettingsLocal.voiceConfig.kokoroVoice) {
                    this.userSettingsLocal.voiceConfig.kokoroVoice = kokoroService.getDefaultVoiceForLang(i18nService.getContentLang());
                }
                this.saveUserSettings();
                this.loadKokoroStats();
            },
            fixCurrentVoice(dontSave) {
                if (this.isKokoroEngine) {
                    if (this.userSettingsLocal.voiceConfig.kokoroVoice &&
                        !this.selectKokoroVoices.map(v => v.id).includes(this.userSettingsLocal.voiceConfig.kokoroVoice)) {
                        this.userSettingsLocal.voiceConfig.kokoroVoice = undefined;
                        if (!dontSave) {
                            this.saveUserSettings();
                        }
                    }
                } else {
                    if (!this.selectVoices.map(v => v.id).includes(this.userSettingsLocal.voiceConfig.preferredVoice)) {
                        this.userSettingsLocal.voiceConfig.preferredVoice = undefined;
                        if (!dontSave) {
                            this.saveUserSettings();
                        }
                    }
                }
            },
            showAllVoicesChanged() {
                this.selectVoices = this.getSelectVoices();
                this.fixCurrentVoice();
                localStorageService.save(KEY_SETTINGS_SHOW_ALL_VOICES, this.selectAllVoices);
            },
            showAllLangsChanged() {
                localStorageService.save(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS, this.selectAllLanguages);
                if (!this.selectLanguages.map(e => e.code).includes(this.userSettingsLocal.contentLang)) {
                    this.userSettingsLocal.contentLang = undefined;
                    this.saveUserSettings();
                }
            },
            getSelectVoices() {
                if (!this.voices) {
                    return []
                }
                this.sortVoices();
                if (this.selectAllVoices) {
                    return this.voices;
                }
                return this.voices.filter(v => i18nService.getBaseLang(v.lang) === i18nService.getContentLangBase());
            },
            sortVoices() {
                this.voices.sort(speechService.voiceSortFn);
            },
            resetVoiceProps() {
                this.userSettingsLocal.voiceConfig.voicePitch = 1;
                this.userSettingsLocal.voiceConfig.voiceRate = 1;
            },
            setVoiceTestText() {
                let voiceLang = i18nService.getContentLang();
                if (!this.isKokoroEngine) {
                    let voice = this.voices.filter(voice => voice.id === this.userSettingsLocal.voiceConfig.preferredVoice)[0];
                    if (voice) voiceLang = voice.lang;
                } else if (this.userSettingsLocal.voiceConfig.kokoroVoice) {
                    let kv = kokoroService.getVoiceById(this.userSettingsLocal.voiceConfig.kokoroVoice);
                    if (kv) voiceLang = kv.lang;
                }
                this.testText = i18nService.tl('thisIsAnEnglishSentence', [], i18nService.getBaseLang(voiceLang));
            },
            testSpeak() {
                if (this.isKokoroEngine) {
                    speechService.speak(this.testText, {
                        preferredVoice: this.userSettingsLocal.voiceConfig.kokoroVoice,
                        useStandardRatePitch: false
                    });
                } else {
                    speechService.speak(this.testText, {
                        preferredVoice: this.userSettingsLocal.voiceConfig.preferredVoice,
                        useStandardRatePitch: false
                    });
                }
            },
            getVoiceDisplayText(voice, allVoicesShown) {
                if (allVoicesShown) {
                    let lang = i18nService.te(`lang.${voice.lang}`) ? i18nService.t(`lang.${voice.lang}`) : voice.langFull;
                    return `${lang}: ${voice.name}, ${voice.local ? 'offline' : 'online'}`
                } else {
                    return `${voice.name}, ${voice.local ? 'offline' : 'online'}`
                }
            },
            async loadKokoroStats() {
                this.kokoroCacheStats = await kokoroService.getCacheStats();
            },
            onKokoroCacheLimitChange() {
                this.saveUserSettings();
                this.loadKokoroStats();
            },
            async precacheCurrentGridKokoro() {
                let curGridId = stateService.getCurrentGridId();
                let grid = curGridId ? await dataService.getGrid(curGridId) : null;
                let elements = grid && grid.gridElements ? grid.gridElements : [];
                if (!elements.length) {
                    let allGrids = await dataService.getGrids();
                    for (let g of allGrids) {
                        if (g && g.gridElements) {
                            elements = elements.concat(g.gridElements);
                        }
                    }
                }
                this.kokoroPrecacheProgress = 0;
                await kokoroService.cacheGridElements(elements, (prog) => {
                    this.kokoroPrecacheProgress = prog;
                });
                setTimeout(() => {
                    this.kokoroPrecacheProgress = undefined;
                    this.loadKokoroStats();
                }, 2000);
            },
            async clearKokoroCache() {
                await kokoroService.clearCache();
                await this.loadKokoroStats();
            },
            async cacheAll() {
                let allGrids = await dataService.getGrids();
                let externalVoice = speechService.getExternalVoice(this.userSettingsLocal.voiceConfig.preferredVoice);
                speechServiceExternal.cacheAll(allGrids, externalVoice, (progress) => {
                    this.externalVoiceCacheProgress = progress;
                });
            }
        },
        async mounted() {
            let thiz = this;
            thiz.setVoiceTestText();
            let grids = await dataService.getGrids(false, true);
            thiz.gridLanguages = gridUtil.getGridsLangs(grids);
            thiz.voices = await speechService.getVoicesInitialized();
            thiz.selectVoices = thiz.getSelectVoices();
            thiz.loadKokoroStats();

            $(document).on(constants.EVENT_KOKORO_CACHE_UPDATED, thiz.loadKokoroStats);
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_KOKORO_CACHE_UPDATED, this.loadKokoroStats);
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
    .engine-option {
        cursor: pointer;
        padding: 6px 12px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
    }
    .kokoro-advanced-card {
        background: #f1f7fe;
        border: 1px solid #c8e1fb;
        border-radius: 8px;
    }
    .cursor-pointer {
        cursor: pointer;
    }
</style>