<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('applicationLanguage') }}</h3>
                <div class="srow">
                    <label class="three columns" for="inLanguage">{{ $t('selectLanguage') }}</label>
                    <select class="five columns" id="inLanguage" v-model="appSettings.appLang" @change="saveAppSettings(appSettings)">
                        <option value="">{{ $t('automatic') }}</option>
                        <option v-for="lang in allLanguages.filter(langObject => appLanguages.includes(langObject.code))" :value="lang.code">{{lang | extractTranslationAppLang}} ({{lang.code}})</option>
                    </select>
                </div>
                <div class="srow" style="margin-bottom: 0.5em">
                    <span class="fa fa-info-circle"></span>
                    <span class="break-word">
                    <i18n path="ifTheTranslationForYourLanguageIsNotAvailable" tag="span">
                        <template v-slot:crowdin>
                            <a href="https://crowdin.com/project/asterics-grid" target="_blank">crowdin.com</a>
                        </template>
                    </i18n>
                </span>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3>{{ $t('lockUserInterface') }}</h3>
                <div class="srow">
                    <label class="three columns" for="unlockPass">{{ $t('passcodeForUnlockingUserInterface') }}</label>
                    <input class="five columns" id="unlockPass" type="number" v-model="appSettings.unlockPasscode" @input="appSettings.unlockPasscode = appSettings.unlockPasscode.substring(0, 6); saveAppSettings(appSettings)" :placeholder="$t('noPasscodeBracket')"/>
                    <button class="three columns" @click="appSettings.unlockPasscode = null; saveAppSettings(appSettings)">{{ $t('reset') }}</button>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('notifications') }}</h3>
                <div>
                    <slider-input :label="'intervalForRemindingMakeBackups'" unit="days" id="backupReminderInterval" min="0" max="100" step="1" v-model.number="metadata.notificationConfig.backupNotifyIntervalDays" @change="saveMetadata(metadata)"/>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('startupHeading') }}</h3>
                <div class="srow">
                    <input id="chkAutoLock" type="checkbox" v-model="appSettings.autoLockOnStartup" @change="saveAppSettings(appSettings)"/>
                    <label for="chkAutoLock">{{ $t('autoLockOnStartup') }}</label>
                </div>
                <div class="srow">
                    <input id="chkAutoFullscreen" type="checkbox" v-model="appSettings.autoFullscreenOnStartup" @change="saveAppSettings(appSettings)"/>
                    <label for="chkAutoFullscreen">{{ $t('autoFullscreenOnStartup') }}</label>
                </div>
                <div class="srow">
                    <input id="chkPinApp" type="checkbox" v-model="appSettings.pinAppOnLock" @change="saveAppSettings(appSettings)"/>
                    <label for="chkPinApp">{{ $t('pinAppOnLock') }}</label>
                </div>
                <div class="srow" v-if="isAndroid">
                    <input id="chkDefaultLauncher" type="checkbox" :checked="isDefaultLauncher" @click.prevent="toggleDefaultLauncher"/>
                    <label for="chkDefaultLauncher" @click.prevent="toggleDefaultLauncher">{{ $t('setAsDefaultLauncher') }}</label>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3>{{ $t('powerSavingHeading') }}</h3>
                <div class="srow">
                    <label class="five columns" for="dimTimeout">{{ $t('dimScreenTimeout') }}</label>
                    <select class="four columns" id="dimTimeout" v-model.number="dimTimeout" @change="updatePowerSettings">
                        <option :value="0">{{ $t('never') }}</option>
                        <option :value="30">30 {{ $t('seconds') }}</option>
                        <option :value="60">1 {{ $t('minute') }}</option>
                        <option :value="120">2 {{ $t('minutes') }}</option>
                        <option :value="300">5 {{ $t('minutes') }}</option>
                    </select>
                </div>
                <div class="srow">
                    <label class="five columns" for="sleepTimeout">{{ $t('sleepScreenTimeout') }}</label>
                    <select class="four columns" id="sleepTimeout" v-model.number="sleepTimeout" @change="updatePowerSettings">
                        <option :value="0">{{ $t('never') }}</option>
                        <option :value="30">30 {{ $t('seconds') }}</option>
                        <option :value="60">1 {{ $t('minute') }}</option>
                        <option :value="180">3 {{ $t('minutes') }}</option>
                        <option :value="300">5 {{ $t('minutes') }}</option>
                        <option :value="600">10 {{ $t('minutes') }}</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="srow">
            <accordion :acc-label="$t('advancedGeneralSettings')" class="eleven columns">
                <div class="srow">
                    <input id="chkSyncNavigation" type="checkbox" v-model="appSettings.syncNavigation" @change="saveAppSettings(appSettings)"/>
                    <label for="chkSyncNavigation">{{ $t('synchronizeNavigationAndLockedState') }}</label>
                </div>
            </accordion>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../../js/service/i18nService";
    import Accordion from "../../components/accordion.vue";
    import SliderInput from '../../modals/input/sliderInput.vue';
    import { settingsSaveMixin } from './settingsSaveMixin';
    import { powerManagementService } from '../../../js/service/powerManagementService';

    export default {
        components: { SliderInput, Accordion},
        props: ["metadata", "appSettings", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages(),
                isAndroid: !!(window.AndroidNative),
                dimTimeout: 60,
                sleepTimeout: 180,
                isDefaultLauncher: false
            }
        },
        methods: {
            updatePowerSettings() {
                this.appSettings.dimTimeout = this.dimTimeout;
                this.appSettings.sleepTimeout = this.sleepTimeout;
                this.saveAppSettings(this.appSettings);
                powerManagementService.setSettings(this.dimTimeout, this.sleepTimeout);
            },
            openHomeSettings() {
                if (window.AndroidNative && window.AndroidNative.openHomeSettings) {
                    window.AndroidNative.openHomeSettings();
                }
            },
            checkDefaultLauncherStatus() {
                if (window.AndroidNative && window.AndroidNative.isDefaultLauncher) {
                    try {
                        this.isDefaultLauncher = !!window.AndroidNative.isDefaultLauncher();
                    } catch (e) {
                        this.isDefaultLauncher = false;
                    }
                }
            },
            toggleDefaultLauncher() {
                this.openHomeSettings();
            }
        },
        async mounted() {
            this.dimTimeout = powerManagementService.getDimTimeout();
            this.sleepTimeout = powerManagementService.getSleepTimeout();

            if (window.AndroidNative) {
                if (window.AndroidNative.getDimTimeoutSeconds) {
                    this.dimTimeout = window.AndroidNative.getDimTimeoutSeconds();
                }
                if (window.AndroidNative.getSleepTimeoutSeconds) {
                    this.sleepTimeout = window.AndroidNative.getSleepTimeoutSeconds();
                }
                this.checkDefaultLauncherStatus();
                this._onVisibilityChange = () => {
                    if (!document.hidden) {
                        this.checkDefaultLauncherStatus();
                    }
                };
                this._onWindowFocus = () => {
                    this.checkDefaultLauncherStatus();
                };
                document.addEventListener('visibilitychange', this._onVisibilityChange);
                window.addEventListener('focus', this._onWindowFocus);
            }
        },
        beforeDestroy() {
            if (this._onVisibilityChange) {
                document.removeEventListener('visibilitychange', this._onVisibilityChange);
            }
            if (this._onWindowFocus) {
                window.removeEventListener('focus', this._onWindowFocus);
            }
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
</style>