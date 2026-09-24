<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" style="max-width: 750px; width: 95%;">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')" :aria-label="t('close')">
                        <i class="fas fa-times"/>
                    </a>
                    <div class="modal-header">
                        <h1 style="display: flex; align-items: center; gap: 10px; font-size: 1.4em; color: #1976d2;">
                            <i class="fas fa-graduation-cap" style="color: #f55036;"></i>
                            <span>{{ t('groqTutorialTitle') }}</span>
                        </h1>
                    </div>

                    <div class="modal-body" style="max-height: 65vh; overflow-y: auto; padding: 4px 8px;">
                        <p style="color: #555; margin-bottom: 16px; font-size: 0.95em;">
                            {{ t('groqTutorialSubtitle') }}
                        </p>

                        <!-- PASO 1 -->
                        <div class="tutorial-step-card">
                            <div class="tutorial-step-badge">1</div>
                            <div class="tutorial-step-content">
                                <h4 style="margin: 0 0 4px 0; color: #212121; font-size: 1.05em;">
                                    {{ t('groqTutorialStep1Title') }}
                                </h4>
                                <p style="margin: 0 0 8px 0; color: #616161; font-size: 0.9em;">
                                    {{ t('groqTutorialStep1Desc') }}
                                </p>
                                <button 
                                    type="button" 
                                    class="button button-outline" 
                                    style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 6px; padding: 2px 12px; font-size: 0.85em; color: #f55036; border-color: #f55036;" 
                                    @click="openWeb"
                                >
                                    <i class="fas fa-external-link-alt"></i>
                                    <span>https://console.groq.com/keys</span>
                                </button>
                            </div>
                        </div>

                        <!-- PASO 2 -->
                        <div class="tutorial-step-card">
                            <div class="tutorial-step-badge">2</div>
                            <div class="tutorial-step-content">
                                <h4 style="margin: 0 0 4px 0; color: #212121; font-size: 1.05em;">
                                    {{ t('groqTutorialStep2Title') }}
                                </h4>
                                <p style="margin: 0; color: #616161; font-size: 0.9em;">
                                    {{ t('groqTutorialStep2Desc') }}
                                </p>
                            </div>
                        </div>

                        <!-- PASO 3 -->
                        <div class="tutorial-step-card">
                            <div class="tutorial-step-badge">3</div>
                            <div class="tutorial-step-content">
                                <h4 style="margin: 0 0 4px 0; color: #212121; font-size: 1.05em;">
                                    {{ t('groqTutorialStep3Title') }}
                                </h4>
                                <p style="margin: 0; color: #616161; font-size: 0.9em;">
                                    {{ t('groqTutorialStep3Desc') }}
                                </p>
                                <div style="margin-top: 6px; display: inline-block; background: #fff3e0; border: 1px dashed #ffb74d; padding: 4px 10px; border-radius: 6px; font-size: 0.85em; color: #e65100;">
                                    <i class="fas fa-key"></i> Formato de ejemplo: <code>gsk_xxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                                </div>
                            </div>
                        </div>

                        <!-- PASO 4 -->
                        <div class="tutorial-step-card">
                            <div class="tutorial-step-badge">4</div>
                            <div class="tutorial-step-content">
                                <h4 style="margin: 0 0 4px 0; color: #212121; font-size: 1.05em;">
                                    {{ t('groqTutorialStep4Title') }}
                                </h4>
                                <p style="margin: 0; color: #616161; font-size: 0.9em;">
                                    {{ t('groqTutorialStep4Desc') }}
                                </p>
                            </div>
                        </div>

                        <!-- CAJA INFORMATIVA BENEFICIOS -->
                        <div style="background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 12px; margin-top: 14px; display: flex; gap: 12px; align-items: flex-start;">
                            <i class="fas fa-shield-alt fa-2x" style="color: #2e7d32; margin-top: 2px;"></i>
                            <div style="font-size: 0.88em; color: #1b5e20;">
                                <strong>{{ t('groqTutorialNoticeTitle') }}</strong>
                                <p style="margin: 4px 0 0 0;">
                                    {{ t('groqTutorialNoticeDesc') }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 1em; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button 
                                type="button" 
                                class="button button-outline" 
                                style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 6px; color: #c62828; border-color: #c62828;" 
                                @click="openVideo"
                            >
                                <i class="fab fa-youtube" style="color: #c62828;"></i>
                                <span>Ver tutorial en YouTube</span>
                            </button>
                            <button 
                                type="button" 
                                class="button button-primary" 
                                style="margin-bottom: 0; display: inline-flex; align-items: center; gap: 6px; background-color: #f55036 !important; border-color: #f55036 !important;" 
                                @click="openWeb"
                            >
                                <i class="fas fa-external-link-alt"></i>
                                <span>{{ t('groqTutorialOpenConsoleBtn') }}</span>
                            </button>
                        </div>
                        <button class="button" @click="$emit('close')">{{ t('close') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { i18nService, GROQ_EMBEDDED_TRANSLATIONS } from '../../js/service/i18nService.js';
    import '../../css/modal.css';

    export default {
        props: ["metadata"],
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
            openWeb() {
                this.$emit('open-web');
            },
            openVideo() {
                const url = 'https://youtu.be/WnodKGtFYP4';
                if (window.AndroidNative && typeof window.AndroidNative.openUrl === 'function') {
                    window.AndroidNative.openUrl(url);
                } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            }
        }
    };
</script>

<style scoped>
    .tutorial-step-card {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        padding: 12px;
        margin-bottom: 10px;
        background: #fdfdfd;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        transition: transform 0.15s, box-shadow 0.15s;
    }
    .tutorial-step-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .tutorial-step-badge {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #1976d2;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.1em;
    }
    .tutorial-step-content {
        flex: 1;
        min-width: 0;
    }
</style>
