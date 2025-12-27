/**
 * Service Worker handler for shared saves
 * Stores shared game saves in IndexedDB for later retrieval
 */

const SHARED_SAVE_DB_NAME = "block-garden";
const SHARED_SAVE_STORE_NAME = "shared-saves";
const SHARED_SAVE_KEY = "pending-shared-save";

/**
 * Initialize IndexedDB for storing shared saves
 * @returns {Promise<IDBDatabase>}
 */
function initSharedSaveDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARED_SAVE_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (
      /** @type {IDBVersionChangeEvent} */
      event,
    ) => {
      const idbRequest =
        /** @type {IDBRequest} */
        (event.target);

      /** @type {IDBDatabase} */
      const db = idbRequest.result;
      if (!db.objectStoreNames.contains(SHARED_SAVE_STORE_NAME)) {
        db.createObjectStore(SHARED_SAVE_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Store shared save in IndexedDB
 * @param {Object} saveData - The parsed save data
 * @param {string} fileName - Original file name
 * @returns {Promise<void>}
 */
export async function storeSharedSave(saveData, fileName) {
  try {
    const db = await initSharedSaveDB();
    const transaction = db.transaction(SHARED_SAVE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SHARED_SAVE_STORE_NAME);

    const sharedSave = {
      id: SHARED_SAVE_KEY,
      data: saveData,
      fileName: fileName || "shared-save.json",
      timestamp: Date.now(),
    };

    await new Promise((resolve, reject) => {
      const putRequest = store.put(sharedSave);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    });

    console.info("[SharedSave] Stored shared save in IndexedDB");
  } catch (error) {
    console.error("[SharedSave] Failed to store shared save:", error);
    throw error;
  }
}

/**
 * Retrieve pending shared save from IndexedDB
 * @returns {Promise<Object|null>} - The shared save object or null if none exists
 */
export async function retrieveSharedSave() {
  try {
    const db = await initSharedSaveDB();
    const transaction = db.transaction(SHARED_SAVE_STORE_NAME, "readonly");
    const store = transaction.objectStore(SHARED_SAVE_STORE_NAME);

    return await new Promise((resolve, reject) => {
      const getRequest = store.get(SHARED_SAVE_KEY);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result);
    });
  } catch (error) {
    console.error("[SharedSave] Failed to retrieve shared save:", error);
    return null;
  }
}

/**
 * Delete pending shared save from IndexedDB
 * @returns {Promise<void>}
 */
export async function deleteSharedSave() {
  try {
    const db = await initSharedSaveDB();
    const transaction = db.transaction(SHARED_SAVE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SHARED_SAVE_STORE_NAME);

    await new Promise((resolve, reject) => {
      const deleteRequest = store.delete(SHARED_SAVE_KEY);
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    });

    console.info("[SharedSave] Deleted shared save from IndexedDB");
  } catch (error) {
    console.error("[SharedSave] Failed to delete shared save:", error);
  }
}
