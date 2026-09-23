import { convertServiceLocal } from '../service/data/convertServiceLocal.js';

class SettingsApp {
    /**
     * @param settings.modelVersion
     * @param settings.appLang
     * @param settings.unlockPasscode
     * @param settings.syncNavigation
     * @param settings.externalSpeechServiceUrl
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;
        this.appLang = settings.appLang || "";
        this.unlockPasscode = settings.unlockPasscode;
        this.syncNavigation = settings.syncNavigation;
        this.externalSpeechServiceUrl = settings.externalSpeechServiceUrl;
        this.autoLockOnStartup = settings.autoLockOnStartup !== undefined ? !!settings.autoLockOnStartup : false;
        this.autoFullscreenOnStartup = settings.autoFullscreenOnStartup !== undefined ? !!settings.autoFullscreenOnStartup : false;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsApp };