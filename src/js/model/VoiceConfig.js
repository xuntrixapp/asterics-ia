class VoiceConfig {
    /**
     * @param settings.preferredVoice
     * @param settings.secondVoice
     * @param settings.voiceLangIsTextLang
     * @param settings.voicePitch
     * @param settings.voiceRate
     * @param settings.waitForSpeechToFinish
     * @param settings.ttsEngine
     * @param settings.kokoroVoice
     * @param settings.kokoroServerUrl
     * @param settings.kokoroCacheLimitMb
     */
    constructor(settings) {
        settings = settings || {};
        this.preferredVoice = settings.preferredVoice;
        this.secondVoice = settings.secondVoice;
        this.voiceLangIsTextLang = settings.voiceLangIsTextLang;
        this.voicePitch = settings.voicePitch;
        this.voiceRate = settings.voiceRate;
        this.waitForSpeechToFinish = settings.waitForSpeechToFinish;
        this.ttsEngine = settings.ttsEngine || 'standard';
        this.kokoroVoice = settings.kokoroVoice || undefined;
        this.kokoroServerUrl = settings.kokoroServerUrl || '';
        this.kokoroCacheLimitMb = settings.kokoroCacheLimitMb !== undefined ? settings.kokoroCacheLimitMb : 500;
    }
}

export { VoiceConfig };