/**
 * 本地存储模块 - StorageService
 * 封装 localStorage 操作，保存词库和设置
 */

class StorageService {
    constructor() {
        this.prefix = 'dictation_';
        this.isAvailable = this.checkAvailability();
    }

    /**
     * 检查 localStorage 是否可用
     * @returns {boolean}
     */
    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage 不可用');
            return false;
        }
    }

    /**
     * 获取存储键名
     * @param {string} key
     * @returns {string}
     */
    getKey(key) {
        return this.prefix + key;
    }

    /**
     * 设置存储项
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serialized);
            return true;
        } catch (e) {
            console.error('存储失败:', e);
            return false;
        }
    }

    /**
     * 获取存储项
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const serialized = localStorage.getItem(this.getKey(key));
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('读取失败:', e);
            return defaultValue;
        }
    }

    /**
     * 移除存储项
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            console.error('删除失败:', e);
            return false;
        }
    }

    /**
     * 清空所有存储
     * @returns {boolean}
     */
    clear() {
        if (!this.isAvailable) return false;
        
        try {
            // 只清除以 prefix 开头的键
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (e) {
            console.error('清空失败:', e);
            return false;
        }
    }

    // ========== 词库管理 ==========

    /**
     * 保存词库
     * @param {string} name - 词库名称
     * @param {string[]} words - 词语数组
     * @returns {boolean}
     */
    saveWordList(name, words) {
        const wordLists = this.getWordLists();
        wordLists[name] = {
            words: words,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        return this.set('wordlists', wordLists);
    }

    /**
     * 获取词库
     * @param {string} name - 词库名称
     * @returns {Object|null}
     */
    getWordList(name) {
        const wordLists = this.getWordLists();
        return wordLists[name] || null;
    }

    /**
     * 获取所有词库
     * @returns {Object}
     */
    getWordLists() {
        return this.get('wordlists', {});
    }

    /**
     * 删除词库
     * @param {string} name
     * @returns {boolean}
     */
    deleteWordList(name) {
        const wordLists = this.getWordLists();
        if (wordLists[name]) {
            delete wordLists[name];
            return this.set('wordlists', wordLists);
        }
        return false;
    }

    /**
     * 更新词库
     * @param {string} name
     * @param {string[]} words
     * @returns {boolean}
     */
    updateWordList(name, words) {
        const wordLists = this.getWordLists();
        if (wordLists[name]) {
            wordLists[name].words = words;
            wordLists[name].updatedAt = Date.now();
            return this.set('wordlists', wordLists);
        }
        return false;
    }

    // ========== 设置管理 ==========

    /**
     * 保存设置
     * @param {Object} settings
     * @returns {boolean}
     */
    saveSettings(settings) {
        return this.set('settings', settings);
    }

    /**
     * 获取设置
     * @returns {Object}
     */
    getSettings() {
        return this.get('settings', {
            interval: 8,
            showWord: true,
            selectedVoice: null
        });
    }

    /**
     * 更新单个设置
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }

    // ========== 历史记录 ==========

    /**
     * 保存练习记录
     * @param {Object} record
     * @returns {boolean}
     */
    saveRecord(record) {
        const records = this.getRecords();
        records.unshift({
            ...record,
            id: Date.now(),
            timestamp: Date.now()
        });
        
        // 只保留最近 50 条记录
        if (records.length > 50) {
            records.length = 50;
        }
        
        return this.set('records', records);
    }

    /**
     * 获取所有记录
     * @returns {Array}
     */
    getRecords() {
        return this.get('records', []);
    }

    /**
     * 删除记录
     * @param {number} id
     * @returns {boolean}
     */
    deleteRecord(id) {
        const records = this.getRecords();
        const index = records.findIndex(r => r.id === id);
        if (index !== -1) {
            records.splice(index, 1);
            return this.set('records', records);
        }
        return false;
    }

    /**
     * 清空记录
     * @returns {boolean}
     */
    clearRecords() {
        return this.remove('records');
    }

    // ========== 上次使用的词语 ==========

    /**
     * 保存上次使用的词语
     * @param {string[]} words
     * @returns {boolean}
     */
    saveLastWords(words) {
        return this.set('lastWords', words);
    }

    /**
     * 获取上次使用的词语
     * @returns {string[]}
     */
    getLastWords() {
        return this.get('lastWords', []);
    }

    // ========== 导出/导入 ==========

    /**
     * 导出所有数据
     * @returns {string} JSON 字符串
     */
    exportData() {
        const data = {
            wordlists: this.getWordLists(),
            settings: this.getSettings(),
            records: this.getRecords(),
            exportedAt: Date.now()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * 导入数据
     * @param {string} jsonString
     * @returns {boolean}
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.wordlists) {
                this.set('wordlists', data.wordlists);
            }
            if (data.settings) {
                this.set('settings', data.settings);
            }
            if (data.records) {
                this.set('records', data.records);
            }
            
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }
}

// 创建全局存储服务实例
const storage = new StorageService();
