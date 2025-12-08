const STYLE_ID = 'dspace-offline-toast-style';
const TOAST_ID = 'dspace-offline-toast';
const DEFAULT_OFFLINE_MESSAGE = "You're offline. Changes will sync when you're back online.";
const DEFAULT_ONLINE_MESSAGE = "You're back online. Changes are syncing now.";

function ensureStyles(doc) {
    if (doc.getElementById(STYLE_ID)) {
        return;
    }
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.offline-toast {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    font-size: 0.95rem;
    z-index: 9999;
    text-align: center;
    max-width: min(90vw, 28rem);
    line-height: 1.4;
    display: none;
}

@media (prefers-reduced-motion: reduce) {
    .offline-toast {
        transition: none;
    }
}`;
    doc.head.appendChild(style);
}

export function installOfflineToast(options = {}) {
    const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined);
    const win = options.window ?? (typeof window !== 'undefined' ? window : undefined);
    const nav = options.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined);
    const offlineMessage = options.offlineMessage ?? options.message ?? DEFAULT_OFFLINE_MESSAGE;
    const onlineMessage = options.onlineMessage ?? DEFAULT_ONLINE_MESSAGE;
    const hideDelayMs = options.hideDelayMs ?? 0;
    const onlineHideDelayMs = options.onlineHideDelayMs ?? (hideDelayMs > 0 ? hideDelayMs : 2000);

    if (!doc || !win || !nav) {
        return { destroy() {} };
    }

    ensureStyles(doc);

    let toast = doc.getElementById(TOAST_ID);
    if (!toast) {
        toast = doc.createElement('div');
        toast.id = TOAST_ID;
        toast.className = 'offline-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.textContent = offlineMessage;
        doc.body.appendChild(toast);
    }

    let hideTimer;
    let offlineVisible = false;

    const show = () => {
        if (hideTimer) {
            win.clearTimeout(hideTimer);
            hideTimer = undefined;
        }
        toast.style.display = 'block';
    };

    const hide = (delayMs = hideDelayMs) => {
        if (hideTimer) {
            win.clearTimeout(hideTimer);
            hideTimer = undefined;
        }
        if (delayMs > 0) {
            hideTimer = win.setTimeout(() => {
                toast.style.display = 'none';
                hideTimer = undefined;
            }, delayMs);
        } else {
            toast.style.display = 'none';
        }
    };

    if (nav.onLine === false) {
        offlineVisible = true;
        show();
    }

    const offlineHandler = () => {
        toast.textContent = offlineMessage;
        offlineVisible = true;
        show();
    };

    const onlineHandler = () => {
        if (!offlineVisible) {
            return;
        }

        if (typeof onlineMessage === 'string' && onlineMessage.length > 0) {
            toast.textContent = onlineMessage;
            show();
            hide(onlineHideDelayMs);
        } else {
            hide();
        }

        offlineVisible = false;
    };

    win.addEventListener('offline', offlineHandler);
    win.addEventListener('online', onlineHandler);

    return {
        element: toast,
        destroy() {
            if (hideTimer) {
                win.clearTimeout(hideTimer);
                hideTimer = undefined;
            }
            win.removeEventListener('offline', offlineHandler);
            win.removeEventListener('online', onlineHandler);
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        },
    };
}

export default installOfflineToast;
