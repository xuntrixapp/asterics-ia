<template>
    <div class="container-fluid px-0 mb-4">
        <div class="row align-items-center">
            <div class="col-8 col-sm-6 col-md-5 order-md-1">
                <h1 name="header" class="inline mb-0" style="font-size: 1.5rem;">
                    {{ header }}
                </h1>
            </div>
            <a v-if="openHelpFn" class="col-2 col-sm-1 col-md black order-md-3" href="javascript:;" @click="openHelpFn"><i class="fas fa-question-circle"></i></a>
            <a v-if="closeFn" id="closeLink" :title="$t('close')" class="col-2 col-sm-1 col-md black order-md-4" href="javascript:;" @click="closeFn"><i class="fas fa-times"/></a>
            <div class="col-12 col-md-5 d-flex align-items-center order-md-2 mt-2 mt-md-0" v-if="gridElement">
                <div class="d-flex align-items-center w-100" style="gap: 8px;">
                    <label class="mb-0" style="font-size: 0.9em; font-weight: bold; white-space: nowrap;">{{ $t('type') || 'Tipo:' }}</label>
                    <select class="form-select form-select-sm" style="flex: 1 1 auto; height: 34px; padding: 2px 8px; font-weight: bold; border: 1px solid #2d7bb4; border-radius: 6px; background-color: #f0f7fc; color: #1a5682;" v-model="gridElement.type" @change="$emit('change-type', gridElement.type)">
                        <option :value="GridElement.ELEMENT_TYPE_NORMAL">🔲 {{ $t('newElement') || 'Celda estándar' }}</option>
                        <option :value="GridElement.ELEMENT_TYPE_COMIC_BUBBLE">💬 {{ $t('newComicBubble') || 'Bocadillo de cómic' }}</option>
                        <option :value="GridElement.ELEMENT_TYPE_LIVE">⭐ {{ $t('newLiveElement') || 'Elemento en vivo' }}</option>
                        <option :value="GridElement.ELEMENT_TYPE_YT_PLAYER">▶ {{ $t('newYouTubePlayer') || 'YouTube' }}</option>
                        <option :value="GridElement.ELEMENT_TYPE_COLLECT">📑 {{ $t('newCollectElement') || 'Colección' }}</option>
                        <option :value="GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION">💬 {{ $t('newMatrixConversation') || 'Matrix' }}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import {GridElement} from "../../js/model/GridElement.js";
    import {i18nService} from "../../js/service/i18nService.js";

    export default {
        props: ["header", "gridElement", "openHelpFn", "closeFn"],
        data() {
            return {
                GridElement: GridElement
            }
        },
        methods: {
            getElementTypeName(type) {
                if (type === GridElement.ELEMENT_TYPE_COMIC_BUBBLE) {
                    return i18nService.t('newComicBubble') || 'Bocadillo de cómic';
                }
                return i18nService.te(type) ? i18nService.t(type) : (i18nService.te(`ELEMENT_TYPE_${type}`) ? i18nService.t(`ELEMENT_TYPE_${type}`) : type);
            }
        },
        mounted() {
        },
    }
</script>

<style scoped>
.header-elem-title {
    font-size: 1.15em;
    font-weight: bold;
    color: #2d7bb4;
    padding: 2px 10px;
    background-color: #f0f4f8;
    border-radius: 4px;
    border: 1px solid #d0dce5;
    display: inline-block;
}
</style>