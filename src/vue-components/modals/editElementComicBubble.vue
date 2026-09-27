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
                <select class="col-12" id="bubbleTypeSelect" v-model="bubbleProps.bubbleType" @change="onBubbleTypeChange">
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

                <!-- 1. Color del trazo del bocadillo -->
                <color-palette-picker
                    id="bubbleLineColor"
                    label="bubbleLineColor"
                    v-model="bubbleProps.borderColor"
                    default-color="#111111"
                    @input="resetTestGrid"
                    @change="resetTestGrid" />

                <!-- 2. Color de relleno del bocadillo -->
                <color-palette-picker
                    id="bubbleFillColor"
                    label="bubbleFillColor"
                    v-model="bubbleProps.fillColor"
                    default-color="#ffffff"
                    @input="resetTestGrid"
                    @change="resetTestGrid" />

                <!-- 3. Color del texto -->
                <color-palette-picker
                    id="fontColor"
                    label="fontColor"
                    v-model="bubbleProps.fontColor"
                    default-color="#111111"
                    @input="onFontColorChange"
                    @change="onFontColorChange" />

                <!-- 4. Color de fondo de celda -->
                <color-palette-picker
                    id="cellBgColor"
                    label="cellBackgroundColor"
                    v-model="bubbleProps.cellBgColor"
                    default-color="transparent"
                    :allow-transparent="true"
                    @input="onCellBgColorChange"
                    @change="onCellBgColorChange" />

                <!-- Botón de guardar colores seleccionados y aplicar a todos -->
                <div class="srow my-3">
                    <div class="offset-sm-4 col-sm-8 px-0 d-flex flex-column gap-2">
                        <!-- 1. Guardar colores como predeterminados -->
                        <button type="button"
                                class="btn-save-bubble-colors col-12 d-flex align-items-center justify-content-center gap-2 py-2"
                                @click="saveBubbleColors">
                            <i :class="['fas', saveSuccess ? 'fa-check' : 'fa-save']"></i>
                            <span>{{ saveSuccess ? ($t('colorsSavedSuccess') || '¡Colores guardados correctamente!') : ($t('saveBubbleColors') || 'Guardar colores para este bocadillo') }}</span>
                        </button>

                        <!-- 2. Aplicar colores a todos los bocadillos del tablero actual -->
                        <button type="button"
                                class="btn-apply-all-colors col-12 d-flex align-items-center justify-content-center gap-2 py-2"
                                @click="openApplyAllConfirm">
                            <i :class="['fas', applyAllSuccess ? 'fa-check' : 'fa-layer-group']"></i>
                            <span>{{ applyAllSuccess ? ($t('colorsAppliedToAllSuccess') || '¡Colores aplicados a todos los bocadillos!') : ($t('applyColorsToAllInBoard') || 'Aplicar colores a todos los bocadillos del tablero') }}</span>
                        </button>
                    </div>
                </div>

                <!-- Diálogo de confirmación personalizado (Sin texto de localhost) -->
                <div v-if="showConfirmApplyAll" class="custom-confirm-backdrop">
                    <div class="custom-confirm-card p-4">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div class="confirm-icon-bubble">
                                <i class="fas fa-palette"></i>
                            </div>
                            <div>
                                <h4 class="mb-1 text-dark fw-bold">{{ $t('applyColorsToAllTitle') || 'Aplicar colores a todos los bocadillos' }}</h4>
                                <div class="text-muted small">{{ $t('applyColorsToAllSubtitle') || 'Actualización de estilos en el tablero' }}</div>
                            </div>
                        </div>

                        <div class="confirm-body-text mb-4">
                            {{ $t('applyColorsToAllConfirmMsg') || 'Se actualizarán los colores (trazo, relleno, texto y fondo de celda) de todos los bocadillos de cómic de este tablero con los colores seleccionados actualmente.' }}
                            <br><br>
                            <strong>{{ $t('doYouWishToContinue') || '¿Deseas continuar y aplicar los cambios?' }}</strong>
                        </div>

                        <div class="d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary px-3" @click="showConfirmApplyAll = false">
                                <i class="fas fa-times me-1"></i> {{ $t('cancel') || 'Cancelar' }}
                            </button>
                            <button type="button" class="btn btn-primary px-3" @click="confirmAndApplyToAll">
                                <i class="fas fa-check me-1"></i> {{ $t('applyToAll') || 'Aplicar a todos' }}
                            </button>
                        </div>
                    </div>
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
import { localStorageService } from '../../js/service/data/localStorageService';
import { GridData } from '../../js/model/GridData';
import { GridElement } from '../../js/model/GridElement';
import Accordion from '../components/accordion.vue';
import SliderInput from './input/sliderInput.vue';
import ColorPalettePicker from './input/colorPalettePicker.vue';
import AppGridDisplay from '../grid-display/appGridDisplay.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    name: 'EditElementComicBubble',
    components: { Accordion, SliderInput, ColorPalettePicker, AppGridDisplay },
    props: ['gridElement', 'gridData'],
    data() {
        return {
            metadata: null,
            currentLang: i18nService.getContentLang(),
            chosenLocale: 'en',
            selectAllLanguages: false,
            allLanguages: i18nService.getAllLanguages(),
            gridLanguages: [],
            testGridData: null,
            saveSuccess: false,
            showConfirmApplyAll: false,
            applyAllSuccess: false
        };
    },
    computed: {
        bubbleProps() {
            if (!this.gridElement.additionalProps) {
                this.$set(this.gridElement, 'additionalProps', {});
            }
            if (!this.gridElement.additionalProps.comicBubble) {
                let saved = localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS') || {};
                this.$set(this.gridElement, 'additionalProps', 'comicBubble', {
                    bubbleType: 'speech',
                    tailPosition: 'bottom-left',
                    text: '',
                    fontFamily: '"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
                    fontSizePct: 100,
                    fontColor: saved.fontColor || '#111111',
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    borderColor: saved.borderColor || '#111111',
                    borderWidth: 3,
                    fillColor: saved.fillColor || '#ffffff',
                    cellBgColor: saved.cellBgColor || 'transparent',
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
        onFontColorChange(color) {
            this.bubbleProps.fontColor = color;
            this.gridElement.fontColor = color;
            this.resetTestGrid();
        },
        onCellBgColorChange(color) {
            this.bubbleProps.cellBgColor = color;
            this.gridElement.backgroundColor = (color === 'transparent' ? null : color);
            this.resetTestGrid();
        },
        onBubbleTypeChange() {
            let savedForType = localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS_' + this.bubbleProps.bubbleType)
                || localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS');
            if (savedForType) {
                if (savedForType.borderColor) this.bubbleProps.borderColor = savedForType.borderColor;
                if (savedForType.fillColor) this.bubbleProps.fillColor = savedForType.fillColor;
                if (savedForType.fontColor) {
                    this.bubbleProps.fontColor = savedForType.fontColor;
                    this.gridElement.fontColor = savedForType.fontColor;
                }
                if (savedForType.cellBgColor) {
                    this.bubbleProps.cellBgColor = savedForType.cellBgColor;
                    this.gridElement.backgroundColor = (savedForType.cellBgColor === 'transparent' ? null : savedForType.cellBgColor);
                }
            }
            this.resetTestGrid();
        },
        saveBubbleColors() {
            let colorsToSave = {
                borderColor: this.bubbleProps.borderColor || '#111111',
                fillColor: this.bubbleProps.fillColor || '#ffffff',
                fontColor: this.bubbleProps.fontColor || '#111111',
                cellBgColor: this.bubbleProps.cellBgColor || 'transparent'
            };
            localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS', colorsToSave);
            if (this.bubbleProps.bubbleType) {
                localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS_' + this.bubbleProps.bubbleType, colorsToSave);
            }
            this.saveSuccess = true;
            setTimeout(() => {
                this.saveSuccess = false;
            }, 3000);
        },
        openApplyAllConfirm() {
            this.showConfirmApplyAll = true;
        },
        async confirmAndApplyToAll() {
            this.showConfirmApplyAll = false;
            let colors = {
                borderColor: this.bubbleProps.borderColor || '#111111',
                fillColor: this.bubbleProps.fillColor || '#ffffff',
                fontColor: this.bubbleProps.fontColor || '#111111',
                cellBgColor: this.bubbleProps.cellBgColor || 'transparent'
            };

            // Guardar también como predeterminados
            localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS', colors);
            if (this.bubbleProps.bubbleType) {
                localStorageService.saveJSON('AG_COMIC_BUBBLE_SAVED_COLORS_' + this.bubbleProps.bubbleType, colors);
            }

            if (this.gridData && this.gridData.gridElements && this.gridData.gridElements.length > 0) {
                for (let el of this.gridData.gridElements) {
                    if (el.type === GridElement.ELEMENT_TYPE_COMIC_BUBBLE) {
                        if (!el.additionalProps) this.$set(el, 'additionalProps', {});
                        if (!el.additionalProps.comicBubble) this.$set(el.additionalProps, 'comicBubble', {});
                        this.$set(el.additionalProps.comicBubble, 'borderColor', colors.borderColor);
                        this.$set(el.additionalProps.comicBubble, 'fillColor', colors.fillColor);
                        this.$set(el.additionalProps.comicBubble, 'fontColor', colors.fontColor);
                        this.$set(el.additionalProps.comicBubble, 'cellBgColor', colors.cellBgColor);
                        this.$set(el, 'fontColor', colors.fontColor);
                        this.$set(el, 'backgroundColor', colors.cellBgColor === 'transparent' ? null : colors.cellBgColor);
                    }
                }
                await dataService.saveGrid(this.gridData);
            }

            this.applyAllSuccess = true;
            setTimeout(() => {
                this.applyAllSuccess = false;
            }, 3500);
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

.btn-save-bubble-colors {
    background-color: #2d7bb4;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95em;
    transition: background-color 0.2s, transform 0.1s;
}

.btn-save-bubble-colors:hover {
    background-color: #236595;
    color: #ffffff;
}

.btn-save-bubble-colors:active {
    transform: scale(0.98);
}

.btn-apply-all-colors {
    background-color: #455a64;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95em;
    transition: background-color 0.2s, transform 0.1s;
}

.btn-apply-all-colors:hover {
    background-color: #37474f;
    color: #ffffff;
}

.btn-apply-all-colors:active {
    transform: scale(0.98);
}

.custom-confirm-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.65);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
}

.custom-confirm-card {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    max-width: 480px;
    width: 90%;
    border: 1px solid #d0dce5;
    animation: modalScaleIn 0.2s ease-out;
}

@keyframes modalScaleIn {
    from {
        opacity: 0;
        transform: scale(0.92);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.confirm-icon-bubble {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #e3f2fd;
    color: #1976d2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
    flex-shrink: 0;
}

.confirm-body-text {
    font-size: 0.95em;
    line-height: 1.5;
    color: #455a64;
}
</style>
