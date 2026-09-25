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
        this.pinAppOnLock = settings.pinAppOnLock !== undefined ? !!settings.pinAppOnLock : false;
        this.dimTimeout = settings.dimTimeout !== undefined ? settings.dimTimeout : 60;
        this.sleepTimeout = settings.sleepTimeout !== undefined ? settings.sleepTimeout : 180;
        this.groqApiKey = settings.groqApiKey || "";
        this.groqModel = settings.groqModel || "openai/gpt-oss-120b";
        this.groqGender = settings.groqGender || "neutral";
        this.groqComplexity = settings.groqComplexity || "intermediate";
        this.groqUserContext = settings.groqUserContext || "";

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsApp };