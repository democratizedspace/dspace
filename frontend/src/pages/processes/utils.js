import processes from './processes.json';
import { getCookieValue, setCookieValue, datetimeAfterDuration, durationInSeconds } from '../../utils.js';

export const getProcess = (processId) => {
    const process = processes.find((process) => process.id === processId);
    return process;
}

export const getProcessBase64Query = (processId) => {
    const process = getProcess(processId);
    if (process) {
        const query = {
            id: process.id,
            consumeItems: process.consumeItems,
            createItems: process.createItems,
            cooldown: process.duration
        };
        const queryString = btoa(JSON.stringify(query))
        return queryString;
    }
};


export const getProcessCooldown = (req, processId) => {
    const cookie = req.headers.get('cookie');
    const key = `process-${processId}-cooldown`;
    const cooldown = getCookieValue(cookie, key);
    return cooldown;
}

export const setProcessCooldown = (req, res, processId) => {
    if (processOnCooldown(req, processId)) {
        return false;
    }

    const process = processes.find((process) => process.id === processId);
    if (!process) {
        return false;
    }

    const cooldownDuration = process.duration;
    const cooldownDurationInSeconds = durationInSeconds(cooldownDuration);

    // get the current date and add the cooldown duration to it
    const cooldownDate = datetimeAfterDuration(cooldownDurationInSeconds);

    // set the cookie to the new cooldown date
    setCookieValue(res, `process-${processId}-cooldown`, cooldownDate);

    return true;
}

export const processOnCooldown = (req, processId) => {
    // if the cooldown datetime is in the future, the process is on cooldown
    const cooldown = getProcessCooldown(req, processId);
    if (cooldown) {
        const cooldownDate = new Date(cooldown);
        const now = new Date();
        if (cooldownDate > now) {
            return true;
        }
    }
    return false;
}

export const finalizeProcess = (req, res, processId) => {
    const process = processes.find((process) => process.id === processId);

    if (!process) {
        return {
            success: false,
            reason: 'processnotfound'
        };
    }

    // check process cooldown
    if (processOnCooldown(req, processId)) {
        return {
            success: false,
            reason: 'cooldown'
        }
    }

    const { consumeItems, createItems } = process;

    // consume the items in the consumeItems list
    for (const consumeItem of consumeItems) {
    }

    // create a cooldown based on the process duration
    setProcessCooldown(req, res, processId);

    return {
        success: true
    };
}