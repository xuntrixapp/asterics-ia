import { localStorageService } from './data/localStorageService';

let _dimTimeout = 60;
let _sleepTimeout = 180;
let _dimTimer = null;
let _sleepTimer = null;
let _isDimmed = false;
let _isSleeping = false;
let _wakingUp = false;

let _dimOverlay = null;
let _sleepOverlay = null;

let powerManagementService = {};

function getOrCreateOverlays() {
    if (!_dimOverlay) {
        _dimOverlay = document.getElementById('pwa-dim-overlay');
        if (!_dimOverlay) {
            _dimOverlay = document.createElement('div');
            _dimOverlay.id = 'pwa-dim-overlay';
            _dimOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999998;pointer-events:none;display:none;transition:opacity 0.6s ease;opacity:0;';
            document.body.appendChild(_dimOverlay);
        }
    }
    if (!_sleepOverlay) {
        _sleepOverlay = document.getElementById('pwa-sleep-overlay');
        if (!_sleepOverlay) {
            _sleepOverlay = document.createElement('div');
            _sleepOverlay.id = 'pwa-sleep-overlay';
            _sleepOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000000;z-index:999999;display:none;cursor:pointer;';
            document.body.appendChild(_sleepOverlay);
        }
    }
}

function dimScreen() {
    if (_isDimmed || _isSleeping) return;
    _isDimmed = true;
    getOrCreateOverlays();
    if (_dimOverlay) {
        _dimOverlay.style.display = 'block';
        requestAnimationFrame(() => {
            if (_dimOverlay) _dimOverlay.style.opacity = '1';
        });
    }
}

function sleepScreen() {
    if (_isSleeping) return;
    _isSleeping = true;
    getOrCreateOverlays();
    if (_sleepOverlay) {
        _sleepOverlay.style.display = 'block';
    }
}

function restoreScreen() {
    let wasDimmedOrSleeping = _isDimmed || _isSleeping;
    _isDimmed = false;
    _isSleeping = false;
    if (_dimOverlay) {
        _dimOverlay.style.opacity = '0';
        setTimeout(() => {
            if (!_isDimmed && _dimOverlay) {
                _dimOverlay.style.display = 'none';
            }
        }, 300);
    }
    if (_sleepOverlay) {
        _sleepOverlay.style.display = 'none';
    }
    return wasDimmedOrSleeping;
}

function handleUserActivity(event) {
    if (_isSleeping || _wakingUp) {
        if (_isSleeping) {
            _wakingUp = true;
            restoreScreen();
            powerManagementService.resetTimers();
            if (event && event.stopPropagation) {
                event.stopPropagation();
            }
            if (event && event.preventDefault) {
                event.preventDefault();
            }
            setTimeout(() => {
                _wakingUp = false;
            }, 350);
            return;
        }
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        return;
    }

    if (_isDimmed) {
        restoreScreen();
    }
    powerManagementService.resetTimers();
}

powerManagementService.init = function () {
    let appSettings = localStorageService.getAppSettings() || {};
    _dimTimeout = appSettings.dimTimeout !== undefined ? appSettings.dimTimeout : 60;
    _sleepTimeout = appSettings.sleepTimeout !== undefined ? appSettings.sleepTimeout : 180;

    if (window.AndroidNative) {
        if (window.AndroidNative.getDimTimeoutSeconds) {
            try {
                let d = window.AndroidNative.getDimTimeoutSeconds();
                if (d !== undefined) _dimTimeout = d;
            } catch (e) {}
        }
        if (window.AndroidNative.getSleepTimeoutSeconds) {
            try {
                let s = window.AndroidNative.getSleepTimeoutSeconds();
                if (s !== undefined) _sleepTimeout = s;
            } catch (e) {}
        }
    }

    getOrCreateOverlays();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'pointerdown'];
    activityEvents.forEach(evt => {
        window.addEventListener(evt, handleUserActivity, { capture: true, passive: false });
    });

    powerManagementService.resetTimers();
};

powerManagementService.setSettings = function (dimSec, sleepSec) {
    _dimTimeout = dimSec < 0 ? 0 : dimSec;
    _sleepTimeout = sleepSec < 0 ? 0 : sleepSec;

    let appSettings = localStorageService.getAppSettings() || {};
    appSettings.dimTimeout = _dimTimeout;
    appSettings.sleepTimeout = _sleepTimeout;
    localStorageService.setAppSettings(appSettings);

    if (window.AndroidNative && window.AndroidNative.setPowerSettings) {
        try {
            window.AndroidNative.setPowerSettings(_dimTimeout, _sleepTimeout);
        } catch (e) {}
    }

    restoreScreen();
    powerManagementService.resetTimers();
};

powerManagementService.getDimTimeout = function () {
    return _dimTimeout;
};

powerManagementService.getSleepTimeout = function () {
    return _sleepTimeout;
};

powerManagementService.resetTimers = function () {
    if (_dimTimer) clearTimeout(_dimTimer);
    if (_sleepTimer) clearTimeout(_sleepTimer);

    if (_dimTimeout > 0) {
        _dimTimer = setTimeout(dimScreen, _dimTimeout * 1000);
    }
    if (_sleepTimeout > 0) {
        _sleepTimer = setTimeout(sleepScreen, _sleepTimeout * 1000);
    }
};

export { powerManagementService };
