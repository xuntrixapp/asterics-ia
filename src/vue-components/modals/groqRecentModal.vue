<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')" :aria-label="$t('close')">
                        <i class="fas fa-times"/>
                    </a>
                    <div class="modal-header">
                        <h1>
                            <i class="fas fa-history" style="margin-right: 8px; color: #2196f3;"></i>
                            {{ $t('groqRecentPhrasesTitle') }}
                        </h1>
                    </div>

                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        <div v-if="recentPhrases.length === 0" style="text-align: center; padding: 2em 1em; color: #757575;">
                            <i class="fas fa-comment-slash fa-3x" style="margin-bottom: 0.5em; opacity: 0.5;"></i>
                            <p>{{ $t('groqRecentPhrasesEmpty') }}</p>
                        </div>
                        <ul v-else class="groq-recent-list" style="list-style: none; padding: 0; margin: 0;">
                            <li v-for="(item, index) in recentPhrases" :key="item.timestamp || index" class="groq-recent-item">
                                <div class="groq-recent-text-box" @click="speakPhrase(item.text)">
                                    <span class="groq-recent-text" :class="fontClass">{{ formatText(item.text) }}</span>
                                    <span v-if="item.rawText" class="groq-recent-raw hide-mobile">{{ item.rawText }}</span>
                                </div>
                                <div class="groq-recent-actions">
                                    <button class="button button-primary groq-speak-btn" @click="speakPhrase(item.text)" :title="$t('groqSpeakAgain')">
                                        <i class="fas fa-volume-up"></i>
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1em;">
                        <button v-if="recentPhrases.length > 0" class="button button-outline" @click="clearHistory" style="color: #d32f2f; border-color: #d32f2f;">
                            <i class="fas fa-trash"></i> {{ $t('groqClearHistory') }}
                        </button>
                        <div v-else></div>
                        <button class="button" @click="$emit('close')">{{ $t('close') }}</button>
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
    import '../../css/modal.css';

    export default {
        props: ["metadata"],
        data() {
            return {
                recentPhrases: []
            };
        },
        computed: {
            fontClass() {
                return (this.metadata && this.metadata.textConfig && this.metadata.textConfig.fontFamily) || '';
            }
        },
        methods: {
            loadRecentPhrases() {
                this.recentPhrases = groqService.getRecentPhrases();
            },
            formatText(text) {
                if (!text) return '';
                let convertMode = this.metadata && this.metadata.textConfig ? this.metadata.textConfig.convertMode : null;
                return util.convertLowerUppercase(text, convertMode);
            },
            speakPhrase(text) {
                if (text) {
                    speechService.speak(text);
                    // Disparar evento para que también aparezca en el subtítulo
                    $(document).trigger(constants.EVENT_GROQ_PHRASE_SPOKEN, [{
                        text: text,
                        rawText: '',
                        status: 'cache'
                    }]);
                }
            },
            clearHistory() {
                if (window.confirm(this.$t('groqClearHistoryConfirm'))) {
                    groqService.clearRecentPhrases();
                    this.recentPhrases = [];
                }
            }
        },
        mounted() {
            this.loadRecentPhrases();
            $(document).on(constants.EVENT_GROQ_RECENT_UPDATED, this.loadRecentPhrases);
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_GROQ_RECENT_UPDATED, this.loadRecentPhrases);
        }
    };
</script>

<style scoped>
    .groq-recent-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        margin-bottom: 8px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        background-color: #fafafa;
        transition: background-color 0.2s;
    }
    .groq-recent-item:hover {
        background-color: #f0f7ff;
        border-color: #90caf9;
    }
    .groq-recent-text-box {
        flex: 1;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        padding-right: 12px;
    }
    .groq-recent-text {
        font-size: 1.15em;
        font-weight: 500;
        color: #212121;
    }
    .groq-recent-raw {
        font-size: 0.85em;
        color: #757575;
        margin-top: 2px;
    }
    .groq-recent-actions {
        display: flex;
        gap: 6px;
    }
    .groq-speak-btn {
        min-width: 44px;
        height: 44px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2em;
        border-radius: 8px;
        background-color: #2e7d32 !important;
        border-color: #2e7d32 !important;
        color: #ffffff !important;
    }
</style>
