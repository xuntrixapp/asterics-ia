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

                    <!-- BARRA DE HERRAMIENTAS: BÚSQUEDA Y AÑADIR -->
                    <div class="groq-dict-toolbar" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="flex: 1; min-width: 240px; position: relative;">
                            <input 
                                type="text" 
                                v-model="searchQuery" 
                                :placeholder="t('groqDictSearchPlaceholder')" 
                                style="width: 100%; margin-bottom: 0; padding-left: 32px;"
                            />
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9e9e9e;"></i>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="button button-primary" style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 6px;" @click="showAddForm = !showAddForm">
                                <i :class="showAddForm ? 'fas fa-minus' : 'fas fa-plus'"></i>
                                {{ t('groqDictAddNew') }}
                            </button>
                            <button v-if="entries.length > 0" class="button button-outline" style="margin-bottom: 0; color: #d32f2f; border-color: #d32f2f;" @click="clearAll">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
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

                    <!-- CUERPO PRINCIPAL: TABLA DE 2 COLUMNAS -->
                    <div class="modal-body" style="max-height: 55vh; overflow-y: auto; padding: 0 4px;">
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
                </div>
            </div>
        </div>
    </div>
</template>

<script>
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
                newSentence: ''
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
                if (window.confirm(this.t('groqDictConfirmDelete'))) {
                    groqService.deleteDictionaryEntry(item.key);
                    this.entries = this.entries.filter(e => e.key !== item.key);
                }
            },
            saveNewEntry() {
                if (!this.newRawText.trim() || !this.newSentence.trim()) return;
                groqService.addCustomDictionaryEntry(this.newRawText, this.newSentence);
                this.newRawText = '';
                this.newSentence = '';
                this.showAddForm = false;
                this.loadEntries();
            },
            clearAll() {
                if (window.confirm(this.t('groqDictConfirmClearAll'))) {
                    groqService.clearDictionary();
                    this.entries = [];
                }
            }
        },
        mounted() {
            this.loadEntries();
        }
    };
</script>

<style scoped>
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
</style>
