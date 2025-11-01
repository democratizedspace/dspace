const STYLE_ID = 'dspace-offline-toast-style';
const TOAST_ID = 'dspace-offline-toast';
const DEFAULT_MESSAGE = "You're offline. Changes will sync when you're back online.";

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
    const message = options.message ?? DEFAULT_MESSAGE;
    const hideDelayMs = options.hideDelayMs ?? 0;

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
        toast.textContent = message;
        doc.body.appendChild(toast);
    }

    let hideTimer;

    const show = () => {
        if (hideTimer) {
            win.clearTimeout(hideTimer);
            hideTimer = undefined;
        }
        toast.style.display = 'block';
    };

    const hide = () => {
        if (hideTimer) {
            win.clearTimeout(hideTimer);
            hideTimer = undefined;
        }
        if (hideDelayMs > 0) {
            hideTimer = win.setTimeout(() => {
                toast.style.display = 'none';
                hideTimer = undefined;
            }, hideDelayMs);
        } else {
            toast.style.display = 'none';
        }
    };

    if (nav.onLine === false) {
        show();
    }

    const offlineHandler = () => {
        toast.textContent = message;
        show();
    };

    const onlineHandler = () => {
        hide();
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
