<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" style="max-width: 900px; width: 95%;">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')" :aria-label="t('close')">
                        <i class="fas fa-times"/>
                    </a>
                    <div class="modal-header">
                        <h1>
                            <i class="fas fa-book" style="margin-right: 8px; color: #2e7d32;"></i>
                            {{ t('groqDictionaryTitle') }}
                            <span class="badge" style="font-size: 0.6em; background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-weight: normal;">
                                {{ filteredEntries.length }} {{ filteredEntries.length === 1 ? t('groqDictSingleCount') : t('groqDictPluralCount') }}
                            </span>
                        </h1>
                    </div>

                    <input type="file" ref="dictFileInput" accept=".json" style="display: none;" @change="handleFileImport"/>

                    <!-- CUERPO PRINCIPAL -->
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto; padding: 0 4px;">
                        <!-- BARRA DE BÚSQUEDA A ANCHO COMPLETO -->
                        <div class="groq-dict-search-row">
                            <input 
                                type="text" 
                                v-model="searchQuery" 
                                :placeholder="t('groqDictSearchPlaceholder')" 
                                class="groq-dict-search-input"
                            />
                            <i class="fas fa-search groq-dict-search-icon"></i>
                        </div>

                        <!-- FILA DE LOS 4 BOTONES DIMENSIONADOS A ANCHO COMPLETO -->
                        <div class="groq-dict-buttons-row">
                            <button class="button button-primary groq-toolbar-btn" @click="showAddForm = !showAddForm" :title="t('groqDictAddNew')">
                                <i :class="showAddForm ? 'fas fa-minus' : 'fas fa-plus'"></i>
                                <span>{{ t('groqDictAddNew') }}</span>
                            </button>
                            <button class="button button-outline groq-toolbar-btn btn-blue" @click="triggerFileImport" :title="t('groqDictImport')">
                                <i class="fas fa-file-upload"></i>
                                <span>{{ t('groqDictImport') }}</span>
                            </button>
                            <button class="button button-outline groq-toolbar-btn btn-green" @click="exportDictionary" :disabled="entries.length === 0" :title="t('groqDictExport')">
                                <i class="fas fa-file-download"></i>
                                <span>{{ t('groqDictExport') }}</span>
                            </button>
                            <button class="button button-outline groq-toolbar-btn btn-red" @click="clearAll" :disabled="entries.length === 0" :title="t('groqDictConfirmClearAll')">
                                <i class="fas fa-trash"></i>
                                <span>{{ t('groqDictClearAll') }}</span>
                            </button>
                        </div>

                        <!-- FORMULARIO DE AÑADIR NUEVA FRASE MANUALMENTE -->
                        <div v-if="showAddForm" class="groq-dict-add-box" style="background: #f1f8e9; border: 1px solid #c5e1a5; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                            <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 1em; color: #2e7d32;">
                                <i class="fas fa-plus-circle"></i> {{ t('groqDictAddNew') }}
                            </h4>
                            <div class="row" style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <div style="flex: 1; min-width: 200px;">
                                    <label style="font-size: 0.85em; margin-bottom: 2px;">{{ t('groqDictColPictos') }}:</label>
                                    <input type="text" v-model="newRawText" placeholder="ej: quiero ir cine papa" style="margin-bottom: 0; width: 100%;"/>
                                </div>
                                <div style="flex: 1.5; min-width: 240px;">
                                    <label style="font-size: 0.85em; margin-bottom: 2px;">{{ t('groqDictColSentence') }}:</label>
                                    <input type="text" v-model="newSentence" placeholder="ej: Quiero ir al cine con papá." style="margin-bottom: 0; width: 100%;"/>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
                                <button class="button" style="margin-bottom: 0;" @click="showAddForm = false">{{ t('cancel') }}</button>
                                <button class="button button-primary" style="margin-bottom: 0;" @click="saveNewEntry" :disabled="!newRawText.trim() || !newSentence.trim()">
                                    <i class="fas fa-save"></i> {{ t('groqDictSave') }}
                                </button>
                            </div>
                        </div>

                        <div v-if="filteredEntries.length === 0" style="text-align: center; padding: 3em 1em; color: #757575;">
                            <i class="fas fa-book-open fa-3x" style="margin-bottom: 0.5em; opacity: 0.4;"></i>
                            <p v-if="searchQuery.trim()">No se encontraron frases que coincidan con "{{ searchQuery }}"</p>
                            <p v-else>{{ t('groqDictionaryEmpty') }}</p>
                        </div>

                        <div v-else class="groq-dict-table-container">
                            <!-- ENCABEZADO DE COLUMNAS -->
                            <div class="groq-dict-header-row hide-mobile" style="display: flex; padding: 8px 12px; background: #e0e0e0; font-weight: bold; border-radius: 6px; margin-bottom: 8px; font-size: 0.9em;">
                                <div style="flex: 1.2; padding-right: 8px;">
                                    <i class="fas fa-cubes" style="margin-right: 4px; color: #1976d2;"></i>
                                    {{ t('groqDictColPictos') }}
                                </div>
                                <div style="flex: 2; padding-right: 8px;">
                                    <i class="fas fa-comment-dots" style="margin-right: 4px; color: #2e7d32;"></i>
                                    {{ t('groqDictColSentence') }}
                                </div>
                                <div style="width: 140px; text-align: center;">
                                    {{ t('actions') }}
                                </div>
                            </div>

                            <!-- FILAS DE FRASES -->
                            <div 
                                v-for="item in filteredEntries" 
                                :key="item.key" 
                                class="groq-dict-row"
                                :class="{ 'is-editing': item.editing }"
                            >
                                <!-- COLUMNA 1: PICTOGRAMAS / ENTRADA -->
                                <div class="groq-dict-col-pictos">
                                    <div v-if="!item.editing" class="groq-pictos-display">
                                        <span class="groq-picto-badge" v-for="(p, pIdx) in item.rawText.split(/[\s,]+/)" :key="pIdx">
                                            {{ p }}
                                        </span>
                                    </div>
                                    <input 
                                        v-else 
                                        type="text" 
                                        v-model="item.editRawText" 
                                        style="width: 100%; margin-bottom: 0; font-size: 0.95em;"
                                    />
                                </div>

                                <!-- COLUMNA 2: FRASE CONJUGADA -->
                                <div class="groq-dict-col-sentence">
                                    <span v-if="!item.editing" class="groq-sentence-text" :class="fontClass">
                                        {{ formatText(item.sentence) }}
                                    </span>
                                    <input 
                                        v-else 
                                        type="text" 
                                        v-model="item.editSentence" 
                                        style="width: 100%; margin-bottom: 0; font-weight: 500;"
                                        @keyup.enter="saveEdit(item)"
                                    />
                                </div>

                                <!-- COLUMNA 3: ACCIONES -->
                                <div class="groq-dict-col-actions">
                                    <!-- Botón Hablar / Escuchar -->
                                    <button 
                                        class="button button-outline groq-action-btn" 
                                        @click="speakPhrase(item.editing ? item.editSentence : item.sentence)"
                                        :title="t('groqSpeakAgain')"
                                        style="color: #2e7d32; border-color: #2e7d32;"
                                    >
                                        <i class="fas fa-volume-up"></i>
                                    </button>

                                    <!-- Botón Editar / Guardar -->
                                    <button 
                                        v-if="!item.editing"
                                        class="button button-outline groq-action-btn" 
                                        @click="startEdit(item)"
                                        :title="t('edit')"
                                        style="color: #1976d2; border-color: #1976d2;"
                                    >
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button 
                                        v-else
                                        class="button button-primary groq-action-btn" 
                                        @click="saveEdit(item)"
                                        :title="t('save')"
                                        style="background-color: #2e7d32 !important; border-color: #2e7d32 !important;"
                                    >
                                        <i class="fas fa-check"></i>
                                    </button>

                                    <!-- Botón Eliminar -->
                                    <button 
                                        class="button button-outline groq-action-btn" 
                                        @click="deleteEntry(item)"
                                        :title="t('delete')"
                                        style="color: #d32f2f; border-color: #d32f2f;"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PIE DE VENTANA MODAL -->
                    <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1em; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                        <span style="font-size: 0.85em; color: #757575;">
                            {{ t('groqDictionarySummary', { count: entries.length }) }}
                        </span>
                        <button class="button" @click="$emit('close')">{{ t('close') }}</button>
                    </div>

                    <!-- DIÁLOGO PERSONALIZADO DE CONFIRMACIÓN / AVISO (Sin ventanas del navegador ni textos de localhost) -->
                    <div v-if="confirmDialog.show" class="groq-dict-dialog-overlay" @click.self="closeConfirmDialog">
                        <div class="groq-dict-dialog-box">
                            <div class="groq-dict-dialog-header" :class="confirmDialog.isDanger ? 'dialog-header-danger' : 'dialog-header-info'">
                                <i :class="confirmDialog.icon" style="margin-right: 10px; font-size: 1.25em;"></i>
                                <h3>{{ confirmDialog.title }}</h3>
                            </div>
                            <div class="groq-dict-dialog-body">
                                <p class="groq-dialog-msg">{{ confirmDialog.message }}</p>
                                <div v-if="confirmDialog.item" class="groq-dialog-item-preview">
                                    <div class="groq-dialog-preview-sentence">{{ confirmDialog.item.sentence }}</div>
                                    <div class="groq-dialog-preview-raw" v-if="confirmDialog.item.rawText">
                                        <i class="fas fa-cubes"></i> {{ confirmDialog.item.rawText }}
                                    </div>
                                </div>
                            </div>
                            <div class="groq-dict-dialog-footer">
                                <button v-if="!confirmDialog.isAlert" class="button" @click="closeConfirmDialog">
                                    {{ t('cancel') }}
                                </button>
                                <button 
                                    v-if="!confirmDialog.isAlert" 
                                    class="button button-primary" 
                                    :class="confirmDialog.isDanger ? 'btn-dialog-danger' : ''"
                                    @click="executeConfirmAction"
                                >
                                    <i :class="confirmDialog.confirmIcon"></i>
                                    <span>{{ confirmDialog.confirmText }}</span>
                                </button>
                                <button v-if="confirmDialog.isAlert" class="button button-primary" @click="closeConfirmDialog">
                                    <i class="fas fa-check"></i>
                                    <span>{{ t('ok') || 'Aceptar' }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import FileSaver from 'file-saver';
    import { fileUtil } from '../../js/util/fileUtil.js';
    import { groqService } from '../../js/service/groqService.js';
    import { speechService } from '../../js/service/speechService.js';
    import { util } from '../../js/util/util.js';
    import { constants } from '../../js/util/constants.js';
    import { i18nService, GROQ_EMBEDDED_TRANSLATIONS } from '../../js/service/i18nService.js';
    import '../../css/modal.css';

    export default {
        props: ["metadata"],
        data() {
            return {
                entries: [],
                searchQuery: '',
                showAddForm: false,
                newRawText: '',
                newSentence: '',
                confirmDialog: {
                    show: false,
                    type: '',
                    isDanger: false,
                    isAlert: false,
                    icon: '',
                    title: '',
                    message: '',
                    item: null,
                    confirmText: '',
                    confirmIcon: ''
                }
            };
        },
        computed: {
            fontClass() {
                return (this.metadata && this.metadata.textConfig && this.metadata.textConfig.fontFamily) || '';
            },
            filteredEntries() {
                if (!this.searchQuery || !this.searchQuery.trim()) {
                    return this.entries;
                }
                const query = this.searchQuery.trim().toLowerCase();
                return this.entries.filter(item => {
                    const matchSentence = item.sentence && item.sentence.toLowerCase().includes(query);
                    const matchRaw = item.rawText && item.rawText.toLowerCase().includes(query);
                    return matchSentence || matchRaw;
                });
            }
        },
        methods: {
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
            },
            loadEntries() {
                const list = groqService.getDictionaryEntries();
                this.entries = list.map(item => ({
                    ...item,
                    editing: false,
                    editSentence: item.sentence,
                    editRawText: item.rawText
                }));
            },
            formatText(text) {
                if (!text) return '';
                let convertMode = this.metadata && this.metadata.textConfig ? this.metadata.textConfig.convertMode : null;
                return util.convertLowerUppercase(text, convertMode);
            },
            speakPhrase(text) {
                if (text) {
                    speechService.speak(text);
                    $(document).trigger(constants.EVENT_GROQ_PHRASE_SPOKEN, [{
                        text: text,
                        rawText: '',
                        status: 'cache'
                    }]);
                }
            },
            startEdit(item) {
                item.editing = true;
                item.editSentence = item.sentence;
                item.editRawText = item.rawText;
            },
            saveEdit(item) {
                if (!item.editSentence || !item.editSentence.trim()) return;
                const ok = groqService.updateDictionaryEntry(item.key, item.editSentence, item.editRawText);
                if (ok) {
                    item.sentence = item.editSentence.trim();
                    item.rawText = (item.editRawText || '').trim();
                    item.editing = false;
                }
            },
            deleteEntry(item) {
                this.confirmDialog = {
                    show: true,
                    type: 'delete_single',
                    isDanger: true,
                    isAlert: false,
                    icon: 'fas fa-trash-alt',
                    title: this.t('delete') || 'Eliminar frase',
                    message: this.t('groqDictConfirmDelete') || '¿Deseas eliminar esta frase del diccionario? Se eliminará tanto del dispositivo como del servidor.',
                    item: item,
                    confirmText: this.t('delete') || 'Eliminar',
                    confirmIcon: 'fas fa-trash-alt'
                };
            },
            clearAll() {
                this.confirmDialog = {
                    show: true,
                    type: 'clear_all',
                    isDanger: true,
                    isAlert: false,
                    icon: 'fas fa-exclamation-triangle',
                    title: this.t('groqDictClearAll') || 'Vaciar todo el diccionario',
                    message: this.t('groqDictConfirmClearAll') || '¿Estás seguro de que deseas vaciar todas las frases del diccionario y la caché? Esta acción eliminará permanentemente todas las frases del dispositivo y del servidor.',
                    item: null,
                    confirmText: this.t('groqDictClearAll') || 'Vaciar todo',
                    confirmIcon: 'fas fa-trash'
                };
            },
            closeConfirmDialog() {
                this.confirmDialog.show = false;
                this.confirmDialog.item = null;
            },
            async executeConfirmAction() {
                const type = this.confirmDialog.type;
                const item = this.confirmDialog.item;
                this.closeConfirmDialog();
                if (type === 'delete_single' && item) {
                    await groqService.deleteDictionaryEntry(item.key);
                    this.entries = this.entries.filter(e => e.key !== item.key);
                } else if (type === 'clear_all') {
                    await groqService.clearDictionary();
                    this.entries = [];
                }
            },
            showAlert(message, title = '', isError = false) {
                this.confirmDialog = {
                    show: true,
                    type: 'alert',
                    isDanger: isError,
                    isAlert: true,
                    icon: isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle',
                    title: title || (isError ? 'Error' : 'Información'),
                    message: message,
                    item: null,
                    confirmText: this.t('ok') || 'Aceptar',
                    confirmIcon: 'fas fa-check'
                };
            },
            saveNewEntry() {
                if (!this.newRawText.trim() || !this.newSentence.trim()) return;
                groqService.addCustomDictionaryEntry(this.newRawText, this.newSentence);
                this.newRawText = '';
                this.newSentence = '';
                this.showAddForm = false;
                this.loadEntries();
            },
            triggerFileImport() {
                if (this.$refs.dictFileInput) {
                    this.$refs.dictFileInput.value = '';
                    this.$refs.dictFileInput.click();
                }
            },
            async handleFileImport(event) {
                let file = event.target.files && event.target.files[0];
                if (!file) return;
                try {
                    let content = await fileUtil.readFileContent(file);
                    let data = JSON.parse(content);
                    let importCount = 0;

                    let list = Array.isArray(data) ? data : (data.groqPhrases || (typeof data === 'object' ? Object.keys(data).map(k => ({ key: k, ...(data[k] || {}) })) : []));
                    for (let item of list) {
                        let raw = item.rawText || item.raw || '';
                        let sentence = item.sentence || item.text || (typeof item === 'string' ? item : '');
                        if (raw && sentence) {
                            groqService.addCustomDictionaryEntry(raw, sentence, item);
                            importCount++;
                        }
                    }
                    this.loadEntries();
                    let msg = this.t('groqDictImportSuccess', { count: importCount });
                    this.showAlert(msg, this.t('groqDictImport') || 'Importar diccionario');
                } catch (e) {
                    console.error('Error importing phrases:', e);
                    this.showAlert('Error al leer el archivo JSON: ' + (e.message || e), 'Error', true);
                }
            },
            exportDictionary() {
                let list = groqService.getDictionaryEntries();
                if (!list || list.length === 0) return;
                let exportData = list.map(item => ({
                    rawText: item.rawText,
                    sentence: item.sentence,
                    key: item.key,
                    timestamp: item.timestamp
                }));
                let blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
                let dateStr = new Date().toISOString().slice(0, 10);
                FileSaver.saveAs(blob, `diccionario_frases_ia_${dateStr}.json`);
            }
        },
        mounted() {
            this.loadEntries();
            $(document).on(constants.EVENT_GROQ_RECENT_UPDATED, this.loadEntries);
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_GROQ_RECENT_UPDATED, this.loadEntries);
        }
    };
</script>

<style scoped>
    .groq-dict-search-row {
        position: relative;
        width: 100%;
        margin-bottom: 8px;
        box-sizing: border-box;
    }
    .groq-dict-search-input {
        width: 100% !important;
        margin-bottom: 0 !important;
        padding-left: 36px !important;
        height: 38px !important;
        box-sizing: border-box !important;
        border-radius: 6px !important;
    }
    .groq-dict-search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #9e9e9e;
        font-size: 0.95em;
    }
    .groq-dict-buttons-row {
        display: flex;
        gap: 8px;
        width: 100%;
        margin-bottom: 12px;
        box-sizing: border-box;
        align-items: stretch;
    }
    .groq-toolbar-btn {
        flex: 1 1 0 !important;
        min-width: 0 !important;
        margin-bottom: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        padding: 0 8px !important;
        height: 42px !important;
        line-height: 42px !important;
        font-size: 1.05rem !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        box-sizing: border-box !important;
        border-radius: 6px !important;
        text-align: center !important;
        cursor: pointer;
    }
    .groq-toolbar-btn i {
        font-size: 1.1em !important;
    }
    .groq-toolbar-btn:disabled {
        opacity: 0.45 !important;
        cursor: not-allowed !important;
        border-color: #ccc !important;
        color: #888 !important;
    }
    .groq-toolbar-btn.btn-blue {
        color: #1565c0 !important;
        border-color: #1565c0 !important;
    }
    .groq-toolbar-btn.btn-green {
        color: #2e7d32 !important;
        border-color: #2e7d32 !important;
    }
    .groq-toolbar-btn.btn-red {
        color: #d32f2f !important;
        border-color: #d32f2f !important;
    }
    @media (max-width: 600px) {
        .groq-dict-buttons-row {
            flex-wrap: wrap;
        }
        .groq-toolbar-btn {
            flex: 1 1 45% !important;
        }
    }
    .groq-dict-row {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 6px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        background-color: #fafafa;
        transition: background-color 0.2s, border-color 0.2s;
        gap: 10px;
    }
    .groq-dict-row:hover {
        background-color: #f7f9fa;
        border-color: #b0bec5;
    }
    .groq-dict-row.is-editing {
        background-color: #e8f5e9;
        border-color: #81c784;
    }
    .groq-dict-col-pictos {
        flex: 1.2;
        min-width: 0;
        word-break: break-word;
    }
    .groq-pictos-display {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }
    .groq-picto-badge {
        display: inline-block;
        background: #e3f2fd;
        color: #1565c0;
        border: 1px solid #bbdefb;
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 0.85em;
        font-weight: 500;
    }
    .groq-dict-col-sentence {
        flex: 2;
        min-width: 0;
        word-break: break-word;
    }
    .groq-sentence-text {
        font-size: 1.05em;
        font-weight: 500;
        color: #212121;
    }
    .groq-dict-col-actions {
        width: 140px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        flex-shrink: 0;
    }
    .groq-action-btn {
        min-width: 38px;
        height: 38px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1em;
        border-radius: 6px;
        margin-bottom: 0 !important;
    }
    @media (max-width: 600px) {
        .groq-dict-row {
            flex-direction: column;
            align-items: stretch;
        }
        .groq-dict-col-actions {
            width: 100%;
            justify-content: flex-end;
            margin-top: 6px;
        }
    }

    /* DIÁLOGO PERSONALIZADO DE CONFIRMACIÓN / AVISO */
    .groq-dict-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10050;
        animation: groqFadeIn 0.2s ease-out;
    }
    .groq-dict-dialog-box {
        background: #ffffff;
        border-radius: 12px;
        width: 90%;
        max-width: 480px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
        overflow: hidden;
        animation: groqPopIn 0.2s ease-out;
    }
    .groq-dict-dialog-header {
        padding: 14px 20px;
        display: flex;
        align-items: center;
        color: #ffffff;
    }
    .dialog-header-danger {
        background: linear-gradient(135deg, #d32f2f, #b71c1c);
    }
    .dialog-header-info {
        background: linear-gradient(135deg, #1976d2, #1565c0);
    }
    .groq-dict-dialog-header h3 {
        margin: 0;
        font-size: 1.15em;
        color: #ffffff;
        font-weight: 600;
    }
    .groq-dict-dialog-body {
        padding: 20px;
        font-size: 1.05rem;
        color: #37474f;
        line-height: 1.5;
    }
    .groq-dialog-msg {
        margin: 0;
    }
    .groq-dialog-item-preview {
        background: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-left: 4px solid #d32f2f;
        border-radius: 6px;
        padding: 10px 14px;
        margin-top: 14px;
    }
    .groq-dialog-preview-sentence {
        font-weight: 600;
        color: #212121;
        font-size: 1.05rem;
    }
    .groq-dialog-preview-raw {
        font-size: 0.85rem;
        color: #757575;
        margin-top: 4px;
    }
    .groq-dict-dialog-footer {
        padding: 12px 20px;
        background: #fafafa;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    .btn-dialog-danger {
        background-color: #d32f2f !important;
        border-color: #d32f2f !important;
        color: #ffffff !important;
    }
    .btn-dialog-danger:hover {
        background-color: #b71c1c !important;
        border-color: #b71c1c !important;
    }
    @keyframes groqFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes groqPopIn {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
</style>
