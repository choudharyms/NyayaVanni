/**
 * IndexedDB utility for managing conversation history
 * Provides CRUD operations for storing and retrieving conversations
 */

const DB_NAME = 'NyayaVanni';
const STORE_NAME = 'conversations';
const DB_VERSION = 1;

class ConversationDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
      };
    });
  }

  /**
   * Add a new conversation
   * @param {Object} conversation - Conversation object
   * @returns {Promise<string>} - Conversation ID
   */
  async addConversation(conversation) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const conversationData = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: conversation.title || 'Untitled Conversation',
        messages: conversation.messages || [],
        timestamp: conversation.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const request = store.add(conversationData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(conversationData.id);
    });
  }

  /**
   * Get all conversations sorted by timestamp (newest first)
   * @returns {Promise<Array>}
   */
  async getAllConversations() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const conversations = request.result || [];
        // Sort by timestamp descending (newest first)
        resolve(conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      };
    });
  }

  /**
   * Get a specific conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<Object>}
   */
  async getConversation(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Update a conversation
   * @param {string} id - Conversation ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateConversation(id, updates) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const conversation = request.result;
        if (conversation) {
          const updated = {
            ...conversation,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          const updateRequest = store.put(updated);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          reject(new Error(`Conversation ${id} not found`));
        }
      };
    });
  }

  /**
   * Delete a conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<void>}
   */
  async deleteConversation(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete all conversations
   * @returns {Promise<void>}
   */
  async clearAllConversations() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Search conversations by title or content
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchConversations(query) {
    if (!this.db) await this.init();

    const conversations = await this.getAllConversations();
    const lowerQuery = query.toLowerCase();

    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(lowerQuery) ||
        conv.messages.some((msg) =>
          msg.message?.toLowerCase().includes(lowerQuery)
        )
    );
  }
}

// Create a singleton instance
const conversationDB = new ConversationDB();

export default conversationDB;
