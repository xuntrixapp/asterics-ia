<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-2" for="inputLabel">{{ $t('bubbleText') }}</label>
            <div class="col-sm-10">
                <textarea rows="2" class="col-12" id="inputLabel" v-focus v-if="gridElement"
                          v-model="gridElement.label[currentLang]"
                          @input="onTextChange"
                          :placeholder="$t('enterBubbleTextPlaceholder')"></textarea>
            </div>
        </div>

        <div class="row">
            <label class="col-sm-2" for="bubbleTypeSelect">{{ $t('bubbleType') }}</label>
            <div class="col-sm-10">
                <select class="col-12" id="bubbleTypeSelect" v-model="bubbleProps.bubbleType" @change="resetTestGrid">
                    <option value="speech">💬 {{ $t('bubbleSpeech') }}</option>
                    <option value="thought">💭 {{ $t('bubbleThought') }}</option>
                    <option value="shout">💥 {{ $t('bubbleShout') }}</option>
                    <option value="whisper">🤫 {{ $t('bubbleWhisper') }}</option>
                    <option value="box">📜 {{ $t('bubbleBox') }}</option>
                </select>
            </div>
        </div>

        <div class="row" v-if="bubbleProps.bubbleType !== 'box'">
            <label class="col-sm-2" for="tailPositionSelect">{{ $t('bubbleTail') }}</label>
            <div class="col-sm-10">
                <select class="col-12" id="tailPositionSelect" v-model="bubbleProps.tailPosition" @change="resetTestGrid">
                    <option value="bottom-left">↙ {{ $t('tailBottomLeft') }}</option>
                    <option value="bottom-center">↓ {{ $t('tailBottomCenter') }}</option>
                    <option value="bottom-right">↘ {{ $t('tailBottomRight') }}</option>
                    <option value="top-left">↖ {{ $t('tailTopLeft') }}</option>
                    <option value="top-right">↗ {{ $t('tailTopRight') }}</option>
                    <option value="left">← {{ $t('tailLeft') }}</option>
                    <option value="right">→ {{ $t('tailRight') }}</option>
                    <option value="none">⚪ {{ $t('tailNone') }}</option>
                </select>
            </div>
        </div>

        <div class="row">
            <label class="col-sm-2" for="inputPronunciation">{{ $t('pronunciation') }}</label>
            <div class="col-sm-10" style="position: relative">
                <input type="text" class="col-12" id="inputPronunciation" v-if="gridElement"
                       v-model="gridElement.pronunciation[currentLang]"
                       :placeholder="getPronunciationPlaceholder(currentLang)"/>
                <button @click="speak(currentLang)" class="input-button" :title="$t('testPronunciation')">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>

        <div class="srow mb-4">
            <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden" @change="resetTestGrid"/>
            <label for="inputHidden">{{ $t('hideElement') }}</label>
        </div>

        <div class="srow" v-if="metadata">
            <accordion :acc-label="$t('advancedOptions')">
                <div class="row">
                    <label class="col-sm-3" for="fontFamilySelect">{{ $t('fontFamily') }}</label>
                    <div class="col-sm-9">
                        <select class="col-12" id="fontFamilySelect" v-model="bubbleProps.fontFamily" @change="resetTestGrid">
                            <option value='"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif'>Comic (Tebeo / Estilo Cómic)</option>
                            <option value='"Arial", "Helvetica", sans-serif'>Arial (Escolar / Imprenta)</option>
                            <option value='"Impact", "Arial Black", sans-serif'>Impact (Negrita fuerte)</option>
                            <option value='"Caveat", "Comic Neue", cursive'>Caveat (Manuscrita)</option>
                            <option value='"Courier New", monospace'>Courier (Máquina de escribir)</option>
                        </select>
                    </div>
                </div>

                <div class="row">
                    <label class="col-sm-3">{{ $t('textAlignment') }}</label>
                    <div class="col-sm-9">
                        <select class="col-12" v-model="bubbleProps.textAlign" @change="resetTestGrid">
                            <option value="left">{{ $t('alignLeft') }}</option>
                            <option value="center">{{ $t('alignCenter') }}</option>
                            <option value="right">{{ $t('alignRight') }}</option>
                        </select>
                    </div>
                </div>

                <div class="row">
                    <label class="col-sm-3">{{ $t('textFormat') }}</label>
                    <div class="col-sm-9 d-flex align-items-center gap-4">
                        <div>
                            <input type="checkbox" id="chkBold" :checked="bubbleProps.fontWeight === 'bold'" @change="toggleBold"/>
                            <label for="chkBold" class="d-inline"><strong>{{ $t('bold') }}</strong></label>
                        </div>
                        <div>
                            <input type="checkbox" id="chkItalic" :checked="bubbleProps.fontStyle === 'italic'" @change="toggleItalic"/>
                            <label for="chkItalic" class="d-inline"><em>{{ $t('italic') }}</em></label>
                        </div>
                        <div>
                            <input type="checkbox" id="chkShadow" v-model="bubbleProps.comicShadow" @change="resetTestGrid"/>
                            <label for="chkShadow" class="d-inline">{{ $t('comicShadow') }}</label>
                        </div>
                    </div>
                </div>

                <slider-input label="fontSize" unit="%" id="fontSize" :show-clear-button="true" min="40" max="250" step="5" v-model.number="gridElement.fontSizePct" @input="onFontSizeChange"/>
                <slider-input label="bubbleLineWidth" unit="px" id="lineWidth" :show-clear-button="true" min="1" max="12" step="1" v-model.number="bubbleProps.borderWidth" @input="resetTestGrid"/>

                <div class="srow">
                    <label class="four columns" for="bubbleLineColor">{{ $t('bubbleLineColor') }}</label>
                    <input class="five columns" type="color" id="bubbleLineColor" v-model="bubbleProps.borderColor" @input="resetTestGrid"/>
                    <button class="two columns" @click="bubbleProps.borderColor = '#111111'; resetTestGrid()">{{ $t('clear') }}</button>
                </div>

                <div class="srow">
                    <label class="four columns" for="bubbleFillColor">{{ $t('bubbleFillColor') }}</label>
                    <input class="five columns" type="color" id="bubbleFillColor" v-model="bubbleProps.fillColor" @input="resetTestGrid"/>
                    <button class="two columns" @click="bubbleProps.fillColor = '#ffffff'; resetTestGrid()">{{ $t('clear') }}</button>
                </div>

                <div class="srow">
                    <label class="four columns" for="fontColor">{{ $t('fontColor') }}</label>
                    <input class="five columns" type="color" id="fontColor" v-model="bubbleProps.fontColor" @input="gridElement.fontColor = bubbleProps.fontColor; resetTestGrid()"/>
                    <button class="two columns" @click="bubbleProps.fontColor = '#111111'; gridElement.fontColor = '#111111'; resetTestGrid()">{{ $t('clear') }}</button>
                </div>

                <div class="srow">
                    <label class="four columns" for="cellBgColor">{{ $t('cellBackgroundColor') }}</label>
                    <input class="five columns" type="color" id="cellBgColor" v-model="bubbleProps.cellBgColor" @input="gridElement.backgroundColor = bubbleProps.cellBgColor; resetTestGrid()"/>
                    <button class="two columns" @click="bubbleProps.cellBgColor = 'transparent'; gridElement.backgroundColor = null; resetTestGrid()">{{ $t('clear') }}</button>
                </div>

                <div class="srow mt-3">
                    <input type="checkbox" id="inputDontCollect" v-if="gridElement" v-model="gridElement.dontCollect"/>
                    <label for="inputDontCollect">{{ $t('dontAddElementToCollectElement') }}</label>
                </div>

                <div class="srow mt-4 mb-2">
                    <label><strong>{{ $t('preview') }}</strong></label>
                </div>
                <app-grid-display class="testGrid" v-if="metadata && testGridData" :key="testGridData.id" style="max-width: 240px; height: 160px; margin: 0 auto; border: 1px dashed #ccc; border-radius: 6px;" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
            </accordion>
        </div>

        <div class="srow">
            <accordion :acc-label="$t('Translations')">
                <div class="row">
                    <label class="col-sm-2" for="translationLanguage">{{ $t('language') }}</label>
                    <div class="col-sm-5">
                        <select class="col-12" id="translationLanguage" v-model="chosenLocale">
                            <option v-for="lang in selectLanguages" :value="lang.code">
                                {{ lang | extractTranslationAppLang }} ({{ lang.code }})
                            </option>
                        </select>
                    </div>
                    <div class="col-sm-5 checkbox-container">
                        <input type="checkbox" id="selectAllLanguages" v-model="selectAllLanguages"/>
                        <label for="selectAllLanguages" class="checkbox-label-small">{{ $t('showAllLanguages') }}</label>
                    </div>
                </div>
                <div class="row">
                    <label class="col-sm-2" for="translatedLabel">{{ $t('bubbleText') }} ({{ chosenLocale }})</label>
                    <div class="col-sm-10">
                        <textarea rows="2" class="col-12" id="translatedLabel" v-model="gridElement.label[chosenLocale]" :placeholder="getLabelPlaceholder(chosenLocale)" @input="resetTestGrid"></textarea>
                    </div>
                </div>
                <div class="row">
                    <label class="col-sm-2" for="translatedPronunciation">{{ $t('pronunciation') }} ({{ chosenLocale }})</label>
                    <div class="col-sm-10" style="position: relative">
                        <input type="text" class="col-12" id="translatedPronunciation" v-model="gridElement.pronunciation[chosenLocale]" :placeholder="getPronunciationPlaceholder(chosenLocale)"/>
                        <button @click="speak(chosenLocale)" class="input-button" :title="$t('testPronunciation')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            </accordion>
        </div>
    </div>
</template>

<script>
import { i18nService } from '../../js/service/i18nService';
import { speechService } from '../../js/service/speechService';
import { dataService } from '../../js/service/data/dataService';
import { GridData } from '../../js/model/GridData';
import { GridElement } from '../../js/model/GridElement';
import Accordion from '../components/accordion.vue';
import SliderInput from './input/sliderInput.vue';
import AppGridDisplay from '../grid-display/appGridDisplay.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    name: 'EditElementComicBubble',
    components: { Accordion, SliderInput, AppGridDisplay },
    props: ['gridElement', 'gridData'],
    data() {
        return {
            metadata: null,
            currentLang: i18nService.getContentLang(),
            chosenLocale: 'en',
            selectAllLanguages: false,
            allLanguages: i18nService.getAllLanguages(),
            gridLanguages: [],
            testGridData: null
        };
    },
    computed: {
        bubbleProps() {
            if (!this.gridElement.additionalProps) {
                this.$set(this.gridElement, 'additionalProps', {});
            }
            if (!this.gridElement.additionalProps.comicBubble) {
                this.$set(this.gridElement.additionalProps, 'comicBubble', {
                    bubbleType: 'speech',
                    tailPosition: 'bottom-left',
                    text: '',
                    fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
                    fontSizePct: 100,
                    fontColor: '#111111',
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    borderColor: '#111111',
                    borderWidth: 3,
                    fillColor: '#ffffff',
                    cellBgColor: 'transparent',
                    comicShadow: true
                });
            }
            return this.gridElement.additionalProps.comicBubble;
        },
        selectLanguages() {
            if (this.selectAllLanguages) {
                return this.allLanguages;
            }
            return this.allLanguages.filter(l => this.gridLanguages.includes(l.code));
        }
    },
    watch: {
        gridElement: {
            deep: true,
            handler() {
                this.resetTestGrid();
            }
        }
    },
    methods: {
        onTextChange() {
            this.bubbleProps.text = this.gridElement.label[this.currentLang] || '';
            this.resetTestGrid();
        },
        onFontSizeChange() {
            this.bubbleProps.fontSizePct = this.gridElement.fontSizePct;
            this.resetTestGrid();
        },
        toggleBold(e) {
            this.bubbleProps.fontWeight = e.target.checked ? 'bold' : 'normal';
            this.resetTestGrid();
        },
        toggleItalic(e) {
            this.bubbleProps.fontStyle = e.target.checked ? 'italic' : 'normal';
            this.resetTestGrid();
        },
        getPronunciationPlaceholder(locale) {
            let label = this.gridElement.label[locale] || '';
            let langName = i18nService.te(`lang.${locale}`) ? i18nService.t(`lang.${locale}`) : locale;
            if (label) {
                return `${i18nService.t('pronunciationOf', label)} (${langName})`;
            }
            return `${i18nService.t('pronunciation')} (${langName})`;
        },
        getLabelPlaceholder(locale) {
            let langName = i18nService.te(`lang.${locale}`) ? i18nService.t(`lang.${locale}`) : locale;
            return `${i18nService.t('bubbleText')} (${langName})`;
        },
        speak(locale) {
            let speakText = this.gridElement.pronunciation[locale] || this.gridElement.label[locale];
            if (!speakText) return;
            speechService.speak(speakText, {
                lang: locale,
                voiceLangIsTextLang: true
            });
        },
        resetTestGrid() {
            if (!this.gridElement) return;
            let elCopy = new GridElement(JSON.parse(JSON.stringify(this.gridElement)));
            elCopy.id = 'preview-el-' + Math.random().toString(36).substring(2, 9);
            elCopy.x = 0;
            elCopy.y = 0;
            elCopy.width = 1;
            elCopy.height = 1;
            this.testGridData = new GridData({
                id: 'preview-grid-' + Math.random().toString(36).substring(2, 9),
                gridElements: [elCopy],
                rowCount: 1,
                minColumnCount: 1
            });
        },
        findUsedLocales() {
            this.gridLanguages = gridUtil.getUsedLocales(this.gridData);
            this.selectAllLanguages = this.gridLanguages.length <= 1;
            let langs = this.gridLanguages.length > 1 ? this.gridLanguages : this.allLanguages.map(l => l.code);
            this.chosenLocale = langs.find(lang => lang !== this.currentLang) || 'en';
        }
    },
    created() {
        if (!this.gridElement) return;
        if (!this.gridElement.label || typeof this.gridElement.label !== 'object') {
            this.$set(this.gridElement, 'label', {});
        }
        if (!this.gridElement.pronunciation || typeof this.gridElement.pronunciation !== 'object') {
            this.$set(this.gridElement, 'pronunciation', {});
        }
        if (!this.gridElement.additionalProps) {
            this.$set(this.gridElement, 'additionalProps', {});
        }
        if (!this.gridElement.additionalProps.comicBubble) {
            this.$set(this.gridElement.additionalProps, 'comicBubble', {
                bubbleType: 'speech',
                tailPosition: 'bottom-left',
                text: '',
                fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
                fontSizePct: 100,
                fontColor: '#111111',
                fontWeight: 'bold',
                fontStyle: 'normal',
                textAlign: 'center',
                borderColor: '#111111',
                borderWidth: 3,
                fillColor: '#ffffff',
                cellBgColor: 'transparent',
                comicShadow: true
            });
        }
    },
    mounted() {
        if (!this.gridElement) return;
        if (!this.gridElement.label || typeof this.gridElement.label !== 'object') {
            this.$set(this.gridElement, 'label', {});
        }
        if (!this.gridElement.pronunciation || typeof this.gridElement.pronunciation !== 'object') {
            this.$set(this.gridElement, 'pronunciation', {});
        }
        if (!this.gridElement.label[this.currentLang] && this.bubbleProps.text) {
            this.$set(this.gridElement.label, this.currentLang, this.bubbleProps.text);
        }
        if (this.gridElement.fontSizePct == null) {
            this.$set(this.gridElement, 'fontSizePct', this.bubbleProps.fontSizePct || 100);
        }
        this.resetTestGrid();
        this.findUsedLocales();
        dataService.getMetadata().then(metadata => {
            this.metadata = metadata;
        });
    }
};
</script>

<style scoped>
.row, .srow {
    margin-top: 0.8em;
}

.checkbox-label-small {
    font-size: 0.9em;
    font-weight: normal;
    margin: 0;
    line-height: 1;
}

.checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.5em;
}

.input-button {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #266697;
}

.gap-4 {
    gap: 1.5rem;
}
</style>
