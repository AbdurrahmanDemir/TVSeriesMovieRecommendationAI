import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * LocalStorage Manager
 * Handles all data persistence operations
 */

class StorageManager {
    /**
     * Save data to localStorage
     */
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     */
    load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * Clear all app data
     */
    clearAll() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // ===== User Preferences =====

    savePreferences(preferences) {
        return this.save(STORAGE_KEYS.preferences, preferences);
    }

    loadPreferences() {
        return this.load(STORAGE_KEYS.preferences, {
            selectedGenres: [],
            selectedActors: [],
            selectedDirectors: [],
            watchedContent: [],
            mediaType: 'both', // 'movie', 'tv', 'both'
            duration: null,
            yearRange: null,
            minRating: 0,
            tone: null,
            themes: [],
            ageRating: null,
            popularity: null
        });
    }

    // ===== Watchlist =====

    saveWatchlist(watchlist) {
        return this.save(STORAGE_KEYS.watchlist, watchlist);
    }

    loadWatchlist() {
        return this.load(STORAGE_KEYS.watchlist, []);
    }

    addToWatchlist(item) {
        const watchlist = this.loadWatchlist();
        const exists = watchlist.find(w => w.id === item.id && w.media_type === item.media_type);
        if (!exists) {
            watchlist.push({
                ...item,
                addedAt: new Date().toISOString()
            });
            this.saveWatchlist(watchlist);
        }
        return watchlist;
    }

    removeFromWatchlist(id, mediaType) {
        const watchlist = this.loadWatchlist();
        const filtered = watchlist.filter(item =>
            !(item.id === id && item.media_type === mediaType)
        );
        this.saveWatchlist(filtered);
        return filtered;
    }

    isInWatchlist(id, mediaType) {
        const watchlist = this.loadWatchlist();
        return watchlist.some(item => item.id === id && item.media_type === mediaType);
    }

    // ===== Favorites =====

    saveFavorites(favorites) {
        return this.save(STORAGE_KEYS.favorites, favorites);
    }

    loadFavorites() {
        return this.load(STORAGE_KEYS.favorites, []);
    }

    addToFavorites(item) {
        const favorites = this.loadFavorites();
        const exists = favorites.find(f => f.id === item.id && f.media_type === item.media_type);
        if (!exists) {
            favorites.push({
                ...item,
                addedAt: new Date().toISOString()
            });
            this.saveFavorites(favorites);
        }
        return favorites;
    }

    removeFromFavorites(id, mediaType) {
        const favorites = this.loadFavorites();
        const filtered = favorites.filter(item =>
            !(item.id === id && item.media_type === mediaType)
        );
        this.saveFavorites(filtered);
        return filtered;
    }

    isFavorite(id, mediaType) {
        const favorites = this.loadFavorites();
        return favorites.some(item => item.id === id && item.media_type === mediaType);
    }

    // ===== Watch History =====

    saveHistory(history) {
        return this.save(STORAGE_KEYS.history, history);
    }

    loadHistory() {
        return this.load(STORAGE_KEYS.history, []);
    }

    addToHistory(item) {
        const history = this.loadHistory();
        // Remove if already exists to update timestamp
        const filtered = history.filter(h =>
            !(h.id === item.id && h.media_type === item.media_type)
        );
        // Add to beginning
        filtered.unshift({
            ...item,
            viewedAt: new Date().toISOString()
        });
        // Keep only last 100 items
        const trimmed = filtered.slice(0, 100);
        this.saveHistory(trimmed);
        return trimmed;
    }

    clearHistory() {
        return this.saveHistory([]);
    }

    // ===== Cache =====

    saveCache(cacheData) {
        return this.save(STORAGE_KEYS.cache, cacheData);
    }

    loadCache() {
        return this.load(STORAGE_KEYS.cache, {});
    }

    getCacheItem(key) {
        const cache = this.loadCache();
        const item = cache[key];

        if (!item) return null;

        // Check if expired
        const now = Date.now();
        if (item.expiresAt && now > item.expiresAt) {
            this.removeCacheItem(key);
            return null;
        }

        return item.data;
    }

    setCacheItem(key, data, ttl = 3600000) { // Default 1 hour
        const cache = this.loadCache();
        cache[key] = {
            data,
            expiresAt: Date.now() + ttl,
            createdAt: Date.now()
        };
        this.saveCache(cache);
    }

    removeCacheItem(key) {
        const cache = this.loadCache();
        delete cache[key];
        this.saveCache(cache);
    }

    clearExpiredCache() {
        const cache = this.loadCache();
        const now = Date.now();
        const cleaned = {};

        Object.keys(cache).forEach(key => {
            const item = cache[key];
            if (!item.expiresAt || now <= item.expiresAt) {
                cleaned[key] = item;
            }
        });

        this.saveCache(cleaned);
    }
}

// Export singleton instance
export default new StorageManager();
