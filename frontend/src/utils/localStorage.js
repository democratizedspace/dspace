export const getLocalStorage = () => {
    if (!window.localStorage) {
        console.log("Local storage is not supported by this browser.");
        return [];
    }

    try {
        return Object.entries(localStorage).map(([key, value]) => ({ key, value }));
    } catch (err) {
        console.error("Error reading from localStorage:", err);
        return [];
    }
};
  