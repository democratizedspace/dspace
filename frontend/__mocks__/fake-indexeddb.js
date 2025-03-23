// Mock for fake-indexeddb
class FDBObjectStore {
    add(entity) {
        return {
            onsuccess: null,
            onerror: null,
            result: 1,
        };
    }

    put(entity) {
        return {
            onsuccess: null,
            onerror: null,
            result: 1,
        };
    }

    delete(id) {
        return {
            onsuccess: null,
            onerror: null,
        };
    }

    get(id) {
        return {
            onsuccess: null,
            onerror: null,
            result: { id },
        };
    }

    getAll() {
        return {
            onsuccess: null,
            onerror: null,
            result: [],
        };
    }
}

module.exports = { FDBObjectStore };
