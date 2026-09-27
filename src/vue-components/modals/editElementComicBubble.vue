<template>
    <div class="container-fluid px-0">
        <!-- 1. Texto del bocadillo -->
        <div class="row mb-2">
            <label class="col-sm-2 col-12 fw-bold" for="inputLabel">{{ $t('bubbleText') }}</label>
            <div class="col-sm-10 col-12">
                <textarea rows="2" class="col-12 form-control" id="inputLabel" v-focus v-if="gridElement"
                          v-model="gridElement.label[currentLang]"
                          @input="onTextChange"
                          :placeholder="$t('enterBubbleTextPlaceholder')"></textarea>
            </div>
        </div>

        <!-- 2. Tipo de bocadillo -->
        <div class="row mb-2">
            <label class="col-sm-2 col-12 fw-bold" for="bubbleTypeSelect">{{ $t('bubbleType') }}</label>
            <div class="col-sm-10 col-12">
                <select class="col-12 form-control" id="bubbleTypeSelect" v-model="bubbleProps.bubbleType" @change="onBubbleTypeChange">
                    <option value="speech">💬 {{ $t('bubbleSpeech') }}</option>
                    <option value="thought">💭 {{ $t('bubbleThought') }}</option>
                    <option value="shout">💥 {{ $t('bubbleShout') }}</option>
                    <option value="whisper">🤫 {{ $t('bubbleWhisper') }}</option>
                    <option value="box">📜 {{ $t('bubbleBox') }}</option>
                </select>
            </div>
        </div>

        <!-- 3. Posición del rabillo -->
        <div class="row mb-2" v-if="bubbleProps.bubbleType !== 'box'">
            <label class="col-sm-2 col-12 fw-bold" for="tailPositionSelect">{{ $t('bubbleTail') }}</label>
            <div class="col-sm-10 col-12">
                <select class="col-12 form-control" id="tailPositionSelect" v-model="bubbleProps.tailPosition" @change="resetTestGrid">
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

        <!-- 4. Pronunciación -->
        <div class="row mb-2">
            <label class="col-sm-2 col-12 fw-bold" for="inputPronunciation">{{ $t('pronunciation') }}</label>
            <div class="col-sm-10 col-12" style="position: relative">
                <input type="text" class="col-12 form-control" id="inputPronunciation" v-if="gridElement"
                       v-model="gridElement.pronunciation[currentLang]"
                       :placeholder="getPronunciationPlaceholder(currentLang)"/>
                <button type="button" @click="speak(currentLang)" class="input-button" :title="$t('testPronunciation')">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-12 d-flex align-items-center gap-2">
                <input type="checkbox" id="inputHidden" v-if="gridElement" v-model="gridElement.hidden" @change="resetTestGrid"/>
                <label for="inputHidden" class="mb-0 cursor-pointer">{{ $t('hideElement') }}</label>
            </div>
        </div>

        <!-- 5. ESTUDIO Y TABLA DE 50 COLORES DEL BOCADILLO (SIEMPRE VISIBLE Y DIRECTO) -->
        <div class="color-studio-container p-3 mb-4 rounded border bg-light">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                    <i class="fas fa-palette text-primary"></i>
                    <span>{{ $t('bubbleColorsAndPalette') || 'Colores y Paleta del Bocadillo (50 Colores)' }}</span>
                </h5>
                <span class="badge bg-primary text-white">50 Colores 🎨</span>
            </div>

            <!-- Pestañas de selección de los 4 colores del bocadillo -->
            <div class="row g-2 mb-3">
                <!-- Pestaña 1: Trazo / Borde -->
                <div class="col-6 col-md-3">
                    <button type="button"
                            class="bubble-color-tab-btn w-100 p-2 d-flex flex-column align-items-center rounded border"
                            :class="{ 'active': activeColorTab === 'border' }"
                            @click="activeColorTab = 'border'">
                        <span class="small fw-bold mb-1">✏️ {{ $t('bubbleLineColor') || 'Trazo / Borde' }}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="mini-swatch" :style="{ backgroundColor: bubbleProps.borderColor || '#111111' }"></span>
                            <span class="mini-hex">{{ (bubbleProps.borderColor || '#111111').toUpperCase() }}</span>
                        </div>
                    </button>
                </div>

                <!-- Pestaña 2: Relleno Bocadillo -->
                <div class="col-6 col-md-3">
                    <button type="button"
                            class="bubble-color-tab-btn w-100 p-2 d-flex flex-column align-items-center rounded border"
                            :class="{ 'active': activeColorTab === 'fill' }"
                            @click="activeColorTab = 'fill'">
                        <span class="small fw-bold mb-1">🎨 {{ $t('bubbleFillColor') || 'Relleno Bocadillo' }}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="mini-swatch" :style="{ backgroundColor: bubbleProps.fillColor || '#ffffff' }"></span>
                            <span class="mini-hex">{{ (bubbleProps.fillColor || '#ffffff').toUpperCase() }}</span>
                        </div>
                    </button>
                </div>

                <!-- Pestaña 3: Color Texto -->
                <div class="col-6 col-md-3">
                    <button type="button"
                            class="bubble-color-tab-btn w-100 p-2 d-flex flex-column align-items-center rounded border"
                            :class="{ 'active': activeColorTab === 'font' }"
                            @click="activeColorTab = 'font'">
                        <span class="small fw-bold mb-1">🔤 {{ $t('fontColor') || 'Color Texto' }}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="mini-swatch" :style="{ backgroundColor: bubbleProps.fontColor || '#111111' }"></span>
                            <span class="mini-hex">{{ (bubbleProps.fontColor || '#111111').toUpperCase() }}</span>
                        </div>
                    </button>
                </div>

                <!-- Pestaña 4: Fondo de Celda -->
                <div class="col-6 col-md-3">
                    <button type="button"
                            class="bubble-color-tab-btn w-100 p-2 d-flex flex-column align-items-center rounded border"
                            :class="{ 'active': activeColorTab === 'cellBg' }"
                            @click="activeColorTab = 'cellBg'">
                        <span class="small fw-bold mb-1">🔲 {{ $t('cellBackgroundColor') || 'Fondo Celda' }}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="mini-swatch" :style="bubbleProps.cellBgColor === 'transparent' ? { background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 6px 6px' } : { backgroundColor: bubbleProps.cellBgColor || '#ffffff' }"></span>
                            <span class="mini-hex">{{ bubbleProps.cellBgColor === 'transparent' ? ($t('transparent') || 'Transp.') : (bubbleProps.cellBgColor || '#FFFFFF').toUpperCase() }}</span>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Panel Activo con la Tabla de 50 Colores Preestablecidos -->
            <div class="active-palette-studio bg-white p-3 rounded border shadow-sm">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="fw-bold text-dark">
                        <i class="fas fa-th me-1 text-primary"></i>
                        <span>{{ activeTabTitle }}</span>
                    </div>
                    <span class="text-muted small">Haz clic en un color para aplicarlo inmediatamente</span>
                </div>

                <!-- Tabla de 50 colores en 5 filas con categorías -->
                <div class="colors-table-grid mb-3">
                    <div v-for="(row, rIdx) in preset50Colors" :key="'studio-row-' + rIdx" class="colors-table-row-wrapper mb-2">
                        <div class="palette-row-category-name">{{ rowLabels[rIdx] }}</div>
                        <div class="colors-table-row">
                            <button v-for="(col, cIdx) in row"
                                    :key="'c-' + rIdx + '-' + cIdx"
                                    type="button"
                                    class="color-grid-cell"
                                    :class="{ 'is-selected': isCurrentColorSelected(col) }"
                                    :style="{ backgroundColor: col }"
                                    :title="col"
                                    @click="selectStudioColor(col)">
                                <i v-if="isCurrentColorSelected(col)" :class="['fas', 'fa-check', isColorDark(col) ? 'text-white' : 'text-dark']"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Opción de fondo transparente si la pestaña es Fondo de Celda -->
                <div v-if="activeColorTab === 'cellBg'" class="mb-3">
                    <button type="button"
                            class="btn-transparent-option d-flex align-items-center gap-2 p-2 w-100 rounded border"
                            :class="{ 'is-selected': bubbleProps.cellBgColor === 'transparent' }"
                            @click="selectStudioColor('transparent')">
                        <span class="checkerboard-box"></span>
                        <span class="fw-bold">{{ $t('transparent') || 'Transparente (Sin color de fondo)' }}</span>
                        <i v-if="bubbleProps.cellBgColor === 'transparent'" class="fas fa-check ms-auto text-primary"></i>
                    </button>
                </div>

                <!-- Barra inferior: Color Personalizado (Hex + Selector Nativo) -->
                <div class="custom-color-edit-bar d-flex align-items-center justify-content-between p-2 rounded border bg-light flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <label class="mb-0 fw-bold small text-secondary">{{ $t('customColor') || 'Color personalizado:' }}</label>
                        <input type="color"
                               class="color-picker-input-inline"
                               :value="safeHexForCurrent"
                               @input="onStudioColorInput" />
                        <input type="text"
                               class="hex-text-input form-control form-control-sm"
                               maxlength="7"
                               :value="currentSelectedHex"
                               @input="onStudioHexTextInput"
                               placeholder="#000000" />
                    </div>
                    <div class="text-muted small">
                        Color activo: <strong>{{ currentSelectedHex }}</strong>
                    </div>
                </div>
            </div>

            <!-- Botones de Acción: Guardar y Aplicar a Todos -->
            <div class="row mt-3 g-2">
                <div class="col-12 col-md-6">
                    <button type="button"
                            class="btn-save-bubble-colors w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                            @click="saveBubbleColors">
                        <i :class="['fas', saveSuccess ? 'fa-check' : 'fa-save']"></i>
                        <span>{{ saveSuccess ? ($t('colorsSavedSuccess') || '¡Colores guardados!') : ($t('saveBubbleColors') || 'Guardar colores para este bocadillo') }}</span>
                    </button>
                </div>
                <div class="col-12 col-md-6">
                    <button type="button"
                            class="btn-apply-all-colors w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                            @click="openApplyAllConfirm">
                        <i :class="['fas', applyAllSuccess ? 'fa-check' : 'fa-layer-group']"></i>
                        <span>{{ applyAllSuccess ? ($t('colorsAppliedToAllSuccess') || '¡Colores aplicados a todos!') : ($t('applyColorsToAllInBoard') || 'Aplicar colores a todos los bocadillos') }}</span>
                    </button>
                </div>
            </div>

            <!-- Diálogo de confirmación para aplicar a todos -->
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
        </div>

        <!-- 6. OPCIONES AVANZADAS: TIPOGRAFÍA, GROSOR Y VISTA PREVIA -->
        <div class="srow">
            <accordion :acc-label="$t('advancedOptions')">
                <div class="row mb-2">
                    <label class="col-sm-3 col-12" for="fontFamilySelect">{{ $t('fontFamily') }}</label>
                    <div class="col-sm-9 col-12">
                        <select class="col-12 form-control" id="fontFamilySelect" v-model="bubbleProps.fontFamily" @change="resetTestGrid">
                            <option value='"Comic Neue", "Comic Sans MS", "Chalkboard SE", cursive, sans-serif'>Comic (Tebeo / Estilo Cómic)</option>
                            <option value='"Arial", "Helvetica", sans-serif'>Arial (Escolar / Imprenta)</option>
                            <option value='"Impact", "Arial Black", sans-serif'>Impact (Negrita fuerte)</option>
                            <option value='"Caveat", "Comic Neue", cursive'>Caveat (Manuscrita)</option>
                            <option value='"Courier New", monospace'>Courier (Máquina de escribir)</option>
                        </select>
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="col-sm-3 col-12">{{ $t('textAlignment') }}</label>
                    <div class="col-sm-9 col-12">
                        <select class="col-12 form-control" v-model="bubbleProps.textAlign" @change="resetTestGrid">
                            <option value="left">{{ $t('alignLeft') }}</option>
                            <option value="center">{{ $t('alignCenter') }}</option>
                            <option value="right">{{ $t('alignRight') }}</option>
                        </select>
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="col-sm-3 col-12">{{ $t('textFormat') }}</label>
                    <div class="col-sm-9 col-12 d-flex align-items-center gap-4 flex-wrap">
                        <div class="d-flex align-items-center gap-1">
                            <input type="checkbox" id="chkBold" :checked="bubbleProps.fontWeight === 'bold'" @change="toggleBold"/>
                            <label for="chkBold" class="mb-0 cursor-pointer"><strong>{{ $t('bold') }}</strong></label>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <input type="checkbox" id="chkItalic" :checked="bubbleProps.fontStyle === 'italic'" @change="toggleItalic"/>
                            <label for="chkItalic" class="mb-0 cursor-pointer"><em>{{ $t('italic') }}</em></label>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <input type="checkbox" id="chkShadow" v-model="bubbleProps.comicShadow" @change="resetTestGrid"/>
                            <label for="chkShadow" class="mb-0 cursor-pointer">{{ $t('comicShadow') }}</label>
                        </div>
                    </div>
                </div>

                <slider-input label="fontSize" unit="%" id="fontSize" :show-clear-button="true" min="40" max="250" step="5" v-model.number="gridElement.fontSizePct" @input="onFontSizeChange"/>
                <slider-input label="bubbleLineWidth" unit="px" id="lineWidth" :show-clear-button="true" min="1" max="12" step="1" v-model.number="bubbleProps.borderWidth" @input="resetTestGrid"/>

                <div class="srow mt-3">
                    <input type="checkbox" id="inputDontCollect" v-if="gridElement" v-model="gridElement.dontCollect"/>
                    <label for="inputDontCollect" class="ms-1">{{ $t('dontAddElementToCollectElement') }}</label>
                </div>

                <!-- Vista previa en tiempo real -->
                <div class="srow mt-4 mb-2 text-center">
                    <label><strong>{{ $t('preview') }}</strong></label>
                </div>
                <app-grid-display class="testGrid" v-if="metadata && testGridData" :key="testGridData.id" style="max-width: 240px; height: 160px; margin: 0 auto; border: 1px dashed #ccc; border-radius: 6px;" :grid-data="testGridData" :metadata="metadata" :watch-for-changes="true"/>
            </accordion>
        </div>

        <!-- 7. TRADUCCIONES -->
        <div class="srow">
            <accordion :acc-label="$t('Translations')">
                <div class="row mb-2">
                    <label class="col-sm-2 col-12" for="translationLanguage">{{ $t('language') }}</label>
                    <div class="col-sm-5 col-6">
                        <select class="col-12 form-control" id="translationLanguage" v-model="chosenLocale">
                            <option v-for="lang in selectLanguages" :value="lang.code" :key="lang.code">
                                {{ lang | extractTranslationAppLang }} ({{ lang.code }})
                            </option>
                        </select>
                    </div>
                    <div class="col-sm-5 col-6 checkbox-container">
                        <input type="checkbox" id="selectAllLanguages" v-model="selectAllLanguages"/>
                        <label for="selectAllLanguages" class="checkbox-label-small">{{ $t('showAllLanguages') }}</label>
                    </div>
                </div>
                <div class="row mb-2">
                    <label class="col-sm-2 col-12" for="translatedLabel">{{ $t('bubbleText') }} ({{ chosenLocale }})</label>
                    <div class="col-sm-10 col-12">
                        <textarea rows="2" class="col-12 form-control" id="translatedLabel" v-model="gridElement.label[chosenLocale]" :placeholder="getLabelPlaceholder(chosenLocale)" @input="resetTestGrid"></textarea>
                    </div>
                </div>
                <div class="row mb-2">
                    <label class="col-sm-2 col-12" for="translatedPronunciation">{{ $t('pronunciation') }} ({{ chosenLocale }})</label>
                    <div class="col-sm-10 col-12" style="position: relative">
                        <input type="text" class="col-12 form-control" id="translatedPronunciation" v-model="gridElement.pronunciation[chosenLocale]" :placeholder="getPronunciationPlaceholder(chosenLocale)"/>
                        <button type="button" @click="speak(chosenLocale)" class="input-button" :title="$t('testPronunciation')">
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
import { fontUtil } from '../../js/util/fontUtil';

const PRESET_50_COLORS = [
    // Fila 1: Escala de grises y neutros (10 colores)
    ['#000000', '#1f1f1f', '#3f3f3f', '#5f5f5f', '#7f7f7f', '#9f9f9f', '#bfbfbf', '#dfdfdf', '#f0f0f0', '#ffffff'],
    // Fila 2: Primarios y vivos estilo cómic (10 colores)
    ['#e53935', '#f4511e', '#fb8c00', '#ffb300', '#fdd835', '#7cb342', '#43a047', '#00acc1', '#1e88e5', '#8e24aa'],
    // Fila 3: Tonos pastel y claros (10 colores)
    ['#ffcdd2', '#ffe0b2', '#fff9c4', '#f0f4c3', '#c8e6c9', '#b2ebf2', '#bbdefb', '#d1c4e9', '#f8bbd0', '#e1bee7'],
    // Fila 4: Tonos intensos y profundos (10 colores)
    ['#b71c1c', '#e65100', '#f57f17', '#33691e', '#1b5e20', '#006064', '#0d47a1', '#311b92', '#880e4f', '#4e342e'],
    // Fila 5: Paleta cómic moderna / Pop Art (10 colores)
    ['#ffeaa7', '#fab1a0', '#ff7675', '#fd79a8', '#fdcb6e', '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#636e72']
];

const ROW_LABELS = [
    '1. Escala de grises y neutros',
    '2. Primarios vivos (Estilo Cómic)',
    '3. Tonos pastel y suaves',
    '4. Tonos intensos y profundos',
    '5. Paleta Pop-Art moderna'
];

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
            applyAllSuccess: false,
            activeColorTab: 'border', // 'border' | 'fill' | 'font' | 'cellBg'
            preset50Colors: PRESET_50_COLORS,
            rowLabels: ROW_LABELS
        };
    },
    computed: {
        bubbleProps() {
            if (!this.gridElement.additionalProps) {
                this.$set(this.gridElement, 'additionalProps', {});
            }
            if (!this.gridElement.additionalProps.comicBubble) {
                let saved = localStorageService.getJSON('AG_COMIC_BUBBLE_SAVED_COLORS') || {};
                this.$set(this.gridElement.additionalProps, 'comicBubble', {
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
        },
        activeTabTitle() {
            switch (this.activeColorTab) {
                case 'border':
                    return '✏️ ' + (i18nService.t('bubbleLineColor') || 'Color del Trazo / Borde');
                case 'fill':
                    return '🎨 ' + (i18nService.t('bubbleFillColor') || 'Color de Relleno del Bocadillo');
                case 'font':
                    return '🔤 ' + (i18nService.t('fontColor') || 'Color del Texto');
                case 'cellBg':
                    return '🔲 ' + (i18nService.t('cellBackgroundColor') || 'Color de Fondo de Celda');
                default:
                    return 'Paleta de colores';
            }
        },
        currentSelectedHex() {
            let val = '';
            switch (this.activeColorTab) {
                case 'border':
                    val = this.bubbleProps.borderColor || '#111111';
                    break;
                case 'fill':
                    val = this.bubbleProps.fillColor || '#ffffff';
                    break;
                case 'font':
                    val = this.bubbleProps.fontColor || '#111111';
                    break;
                case 'cellBg':
                    val = this.bubbleProps.cellBgColor || 'transparent';
                    break;
            }
            return val === 'transparent' ? (i18nService.t('transparent') || 'Transparente') : (val || '').toUpperCase();
        },
        safeHexForCurrent() {
            let val = '';
            switch (this.activeColorTab) {
                case 'border':
                    val = this.bubbleProps.borderColor;
                    break;
                case 'fill':
                    val = this.bubbleProps.fillColor;
                    break;
                case 'font':
                    val = this.bubbleProps.fontColor;
                    break;
                case 'cellBg':
                    val = this.bubbleProps.cellBgColor;
                    break;
            }
            if (!val || val === 'transparent' || !val.startsWith('#') || val.length !== 7) {
                return '#ffffff';
            }
            return val;
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
        selectStudioColor(color) {
            switch (this.activeColorTab) {
                case 'border':
                    this.bubbleProps.borderColor = color;
                    break;
                case 'fill':
                    this.bubbleProps.fillColor = color;
                    break;
                case 'font':
                    this.bubbleProps.fontColor = color;
                    this.gridElement.fontColor = color;
                    break;
                case 'cellBg':
                    this.bubbleProps.cellBgColor = color;
                    this.gridElement.backgroundColor = (color === 'transparent' ? null : color);
                    break;
            }
            this.resetTestGrid();
        },
        onStudioColorInput(e) {
            let color = e.target.value;
            this.selectStudioColor(color);
        },
        onStudioHexTextInput(e) {
            let color = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                this.selectStudioColor(color);
            }
        },
        isCurrentColorSelected(color) {
            let current = '';
            switch (this.activeColorTab) {
                case 'border':
                    current = this.bubbleProps.borderColor || '#111111';
                    break;
                case 'fill':
                    current = this.bubbleProps.fillColor || '#ffffff';
                    break;
                case 'font':
                    current = this.bubbleProps.fontColor || '#111111';
                    break;
                case 'cellBg':
                    current = this.bubbleProps.cellBgColor || 'transparent';
                    break;
            }
            return current.toLowerCase() === color.toLowerCase();
        },
        isColorDark(hex) {
            try {
                return fontUtil.isHexDark(hex);
            } catch (e) {
                return false;
            }
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
    margin-top: 0.6em;
}

.cursor-pointer {
    cursor: pointer;
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

.color-studio-container {
    background-color: #f8fafc;
    border-color: #cbd5e1 !important;
}

.bubble-color-tab-btn {
    background-color: #ffffff;
    border-color: #cbd5e1;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.bubble-color-tab-btn:hover {
    background-color: #f1f5f9;
    border-color: #94a3b8;
}

.bubble-color-tab-btn.active {
    background-color: #e0f2fe;
    border-color: #0284c7 !important;
    box-shadow: 0 0 0 2px #0284c7;
}

.mini-swatch {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    border: 1px solid rgba(0,0,0,0.25);
    box-shadow: inset 0 0 2px rgba(0,0,0,0.2);
}

.mini-hex {
    font-size: 0.8em;
    font-family: monospace;
    font-weight: bold;
    color: #334155;
}

.active-palette-studio {
    border-color: #cbd5e1 !important;
}

.palette-row-category-name {
    font-size: 0.82em;
    font-weight: 600;
    color: #475569;
    margin-bottom: 2px;
    text-align: left;
}

.colors-table-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background-color: #f8fafc;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.colors-table-row {
    display: flex;
    gap: 4px;
    justify-content: space-between;
}

.color-grid-cell {
    flex: 1 1 0;
    height: 28px;
    min-width: 20px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8em;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    padding: 0;
}

.color-grid-cell:hover {
    transform: scale(1.18);
    z-index: 3;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    border-color: #333;
}

.color-grid-cell.is-selected {
    box-shadow: 0 0 0 2px #0284c7, inset 0 0 2px rgba(0,0,0,0.5);
    border-color: #fff;
    transform: scale(1.08);
}

.btn-transparent-option {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.2s;
}

.btn-transparent-option:hover {
    background-color: #f1f5f9;
}

.btn-transparent-option.is-selected {
    border-color: #0284c7 !important;
    background-color: #e0f2fe;
}

.checkerboard-box {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    display: inline-block;
    background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px;
    border: 1px solid #adb5bd;
}

.custom-color-edit-bar {
    border-color: #cbd5e1 !important;
}

.color-picker-input-inline {
    width: 34px;
    height: 30px;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    cursor: pointer;
}

.hex-text-input {
    width: 90px;
    height: 30px;
    font-size: 0.9em;
    font-family: monospace;
}

.btn-save-bubble-colors {
    background-color: #0284c7;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95em;
    transition: background-color 0.2s;
}

.btn-save-bubble-colors:hover {
    background-color: #0369a1;
}

.btn-apply-all-colors {
    background-color: #475569;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95em;
    transition: background-color 0.2s;
}

.btn-apply-all-colors:hover {
    background-color: #334155;
}

.custom-confirm-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
}

.custom-confirm-card {
    background-color: #ffffff;
    border-radius: 8px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    animation: fadeInModal 0.2s ease;
}

.confirm-icon-bubble {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #e0f2fe;
    color: #0284c7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
}

.confirm-body-text {
    font-size: 0.95em;
    line-height: 1.5;
    color: #475569;
}

@keyframes fadeInModal {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
</style>
