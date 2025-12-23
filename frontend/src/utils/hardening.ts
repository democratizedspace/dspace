import * as hardening from '../../../common/hardening.js';

export type { Hardening, HardeningHistoryEntry, HardeningEmoji } from '../../../common/hardening';

export const {
    HARDENING_EMOJIS,
    defaultHardening,
    clampScore,
    emojiForHardening,
    validateHardening,
    normalizeHardening,
    evaluateQuestQuality,
    evaluateProcessQuality,
    hardeningStatusText,
} = hardening;

export default hardening;
