import { localStorageService } from './data/localStorageService';
import { util } from '../util/util';

let _beforeUnloadHandler = null;
let _wakeLock = null;

let kioskService = {};

kioskService.lockApp = async function () {
    let appSettings = localStorageService.getAppSettings() || {};

    // 1. Android Native Kiosk / Lock Task
    if (window.AndroidNative && window.AndroidNative.setAppLocked) {
        try {
            window.AndroidNative.setAppLocked(true);
        } catch (e) {}
    }

    // 2. Web Kiosk / Pinning behavior
    if (appSettings.pinAppOnLock) {
        // Enforce Fullscreen safely
        if (!util.isFullscreen()) {
            try {
                let p = util.openFullscreen();
                if (p && p.catch) {
                    p.catch(() => {
                        // User gesture needed: attach one-time listener
                        const onGesture = () => {
                            if (!util.isFullscreen()) {
                                try { util.openFullscreen(); } catch (err) {}
                            }
                        };
                        window.addEventListener('pointerdown', onGesture, { once: true });
                    });
                }
            } catch (e) {
                const onGesture = () => {
                    if (!util.isFullscreen()) {
                        try { util.openFullscreen(); } catch (err) {}
                    }
                };
                window.addEventListener('pointerdown', onGesture, { once: true });
            }
        }

        // Prevent accidental tab/window closing or navigating away
        if (!_beforeUnloadHandler) {
            _beforeUnloadHandler = function (e) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            };
            window.addEventListener('beforeunload', _beforeUnloadHandler);
        }

        // Lock keyboard if supported (Chromium Fullscreen Keyboard Lock API)
        if (navigator.keyboard && navigator.keyboard.lock) {
            try {
                await navigator.keyboard.lock(['Escape', 'F11', 'Tab', 'AltLeft', 'AltRight']);
            } catch (e) {}
        }

        // Prevent screen sleep via Wake Lock API
        if ('wakeLock' in navigator && !_wakeLock) {
            try {
                _wakeLock = await navigator.wakeLock.request('screen');
            } catch (e) {}
        }
    }
};

kioskService.unlockApp = function () {
    // 1. Android Native Unlock
    if (window.AndroidNative && window.AndroidNative.setAppLocked) {
        try {
            window.AndroidNative.setAppLocked(false);
        } catch (e) {}
    }

    // 2. Remove Web Kiosk traps
    if (_beforeUnloadHandler) {
        window.removeEventListener('beforeunload', _beforeUnloadHandler);
        _beforeUnloadHandler = null;
    }

    if (navigator.keyboard && navigator.keyboard.unlock) {
        try {
            navigator.keyboard.unlock();
        } catch (e) {}
    }

    if (_wakeLock) {
        try {
            _wakeLock.release();
        } catch (e) {}
        _wakeLock = null;
    }
};

export { kioskService };
