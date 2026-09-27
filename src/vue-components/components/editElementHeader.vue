<template>
    <div class="container-fluid px-0 mb-5">
        <div class="row">
            <div class="col-8 col-sm-10 col-md-5 order-md-1">
                <h1 name="header" class="inline">
                    {{ header }}
                </h1>
            </div>
            <a v-if="openHelpFn" class="col-2 col-sm-1 col-md black order-md-3" href="javascript:;" @click="openHelpFn"><i class="fas fa-question-circle"></i></a>
            <a v-if="closeFn" id="closeLink" :title="$t('close')" class="col-2 col-sm-1 col-md black order-md-4" href="javascript:;" @click="closeFn"><i class="fas fa-times"/></a>
            <div class="col-12 col-md-5 d-flex align-items-center order-md-2 mt-2 mt-md-0" v-if="gridElement">
                <div v-if="gridElement.type === GridElement.ELEMENT_TYPE_NORMAL">
                    <img class="me-1" v-if="gridElement.image && (gridElement.image.data || gridElement.image.url)" height="30" :src="gridElement.image.data || gridElement.image.url"/>
                    <span class="header-elem-title">{{ gridElement.label | extractTranslation }}</span>
                </div>
                <div v-if="gridElement.type !== GridElement.ELEMENT_TYPE_NORMAL">
                    <span class="header-elem-title">{{ getElementTypeName(gridElement.type) }}</span>
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