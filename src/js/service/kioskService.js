import { localStorageService } from './data/localStorageService';
import { util } from '../util/util';

let _beforeUnloadHandler = null;
let _popstateHandler = null;
let _wakeLock = null;

let kioskService = {};

kioskService.lockApp = async function () {
    let appSettings = localStorageService.getAppSettings() || {};

    // 1. Android Native Kiosk / Lock Task
    if (window.AndroidNative && window.AndroidNative.setAppLocked) {
        window.AndroidNative.setAppLocked(true);
    }

    // 2. Web Kiosk / Pinning behavior
    if (appSettings.pinAppOnLock) {
        // Enforce Fullscreen
        if (!util.isFullscreen()) {
            util.openFullscreen();
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

        // Trap history navigation (back button)
        try {
            window.history.pushState({ appLocked: true }, document.title, window.location.href);
            if (!_popstateHandler) {
                _popstateHandler = function () {
                    window.history.pushState({ appLocked: true }, document.title, window.location.href);
                };
                window.addEventListener('popstate', _popstateHandler);
            }
        } catch (e) {}

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
        window.AndroidNative.setAppLocked(false);
    }

    // 2. Remove Web Kiosk traps
    if (_beforeUnloadHandler) {
        window.removeEventListener('beforeunload', _beforeUnloadHandler);
        _beforeUnloadHandler = null;
    }

    if (_popstateHandler) {
        window.removeEventListener('popstate', _popstateHandler);
        _popstateHandler = null;
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
