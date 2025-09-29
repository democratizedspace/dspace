const DEFAULT_RESET_DELAY = 350;

export function createTouchClickGuard(resetDelay = DEFAULT_RESET_DELAY) {
    let skipNextClick = false;
    let resetTimer;

    return (event, action) => {
        if (typeof action !== 'function') {
            return;
        }

        if (!event) {
            action();
            return;
        }

        if (event.type === 'touchstart') {
            skipNextClick = true;
            if (typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (resetTimer) {
                clearTimeout(resetTimer);
            }
            resetTimer = setTimeout(() => {
                skipNextClick = false;
                resetTimer = undefined;
            }, resetDelay);
            action();
            return;
        }

        if (skipNextClick && event.type === 'click') {
            skipNextClick = false;
            if (resetTimer) {
                clearTimeout(resetTimer);
                resetTimer = undefined;
            }
            return;
        }

        action();
    };
}
