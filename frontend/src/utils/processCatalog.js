import processes from '../generated/processes.json';
import { onBrowserAsync } from './ssr.js';

export function mergeProcessLists(builtInProcesses = [], customProcesses = []) {
    return [...builtInProcesses, ...customProcesses];
}

export async function getMergedProcessCatalog({
    builtInProcesses = processes,
    customProcessesLoader,
    onError,
} = {}) {
    try {
        const customProcesses = await onBrowserAsync(async () => {
            try {
                const list = customProcessesLoader
                    ? await customProcessesLoader()
                    : await (async () => {
                          const { db, ENTITY_TYPES } = await import('./customcontent.js');
                          return db.list(ENTITY_TYPES.PROCESS);
                      })();
                return Array.isArray(list) ? list : [];
            } catch (error) {
                if (onError) {
                    onError(error);
                } else {
                    console.warn('Failed to load custom processes:', error);
                }
                return [];
            }
        }, []);

        return mergeProcessLists(builtInProcesses, customProcesses);
    } catch (error) {
        if (onError) {
            onError(error);
        } else {
            console.warn('Failed to load custom processes:', error);
        }
        return builtInProcesses;
    }
}
