const DB_NAME = "NyayaVanniDB";
const DB_VERSION = 1;
const STORE_NAME = "chatHistory";

// Helper function to open or create the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Save chat history to IndexedDB
 * @param {Array} history - The chat history array to save
 */
export const saveChatHistory = async (history) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // We store the array under a single record with ID 'general-chat'
    store.put({ id: "general-chat", history });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error("Failed to save chat history to IndexedDB:", error);
    return false;
  }
};

/**
 * Retrieve chat history from IndexedDB
 * @returns {Array|null} The saved history array or null if none
 */
export const getChatHistory = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("general-chat");

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.history);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Failed to get chat history from IndexedDB:", error);
    return null;
  }
};
