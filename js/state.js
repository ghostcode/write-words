/**
 * 状态管理模块 - StateManager
 * 管理应用的所有状态数据
 */

class StateManager {
    constructor() {
        // 词语列表
        this.words = [];
        
        // 当前状态
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.isPreparing = false; // 是否处于准备倒计时阶段
        
        // 设置
        this.interval = 8; // 默认8秒
        this.showWord = true; // 是否显示词语
        this.selectedVoice = null; // 选中的语音
        
        // 检查结果
        this.checkResults = new Map(); // word -> boolean (true=正确, false=错误)
        
        // 开始时间
        this.startTime = null;
        this.endTime = null;
        
        // 监听器
        this.listeners = {
            wordsChanged: [],
            currentIndexChanged: [],
            playStateChanged: [],
            settingsChanged: [],
            checkResultsChanged: []
        };
    }

    // ========== 词语管理 ==========
    
    /**
     * 添加单个词语
     * @param {string} word - 要添加的词语
     * @returns {boolean} 是否添加成功
     */
    addWord(word) {
        const trimmed = word.trim();
        if (!trimmed) return false;
        
        // 检查是否已存在
        if (this.words.includes(trimmed)) return false;
        
        this.words.push(trimmed);
        this.notify('wordsChanged');
        return true;
    }

    /**
     * 批量添加词语
     * @param {string[]} words - 词语数组
     * @returns {number} 成功添加的数量
     */
    addWords(words) {
        let added = 0;
        words.forEach(word => {
            if (this.addWord(word)) {
                added++;
            }
        });
        return added;
    }

    /**
     * 删除词语
     * @param {number} index - 词语索引
     * @returns {boolean} 是否删除成功
     */
    removeWord(index) {
        if (index < 0 || index >= this.words.length) return false;
        
        this.words.splice(index, 1);
        
        // 调整当前索引
        if (this.currentIndex >= this.words.length) {
            this.currentIndex = Math.max(0, this.words.length - 1);
        }
        
        this.notify('wordsChanged');
        return true;
    }

    /**
     * 编辑词语
     * @param {number} index - 词语索引
     * @param {string} newWord - 新词语
     * @returns {boolean} 是否编辑成功
     */
    editWord(index, newWord) {
        const trimmed = newWord.trim();
        if (!trimmed) return false;
        if (index < 0 || index >= this.words.length) return false;
        
        // 检查是否与其他词语重复
        const otherIndex = this.words.findIndex((w, i) => w === trimmed && i !== index);
        if (otherIndex !== -1) return false;
        
        this.words[index] = trimmed;
        this.notify('wordsChanged');
        return true;
    }

    /**
     * 清空所有词语
     */
    clearAllWords() {
        this.words = [];
        this.currentIndex = 0;
        this.checkResults.clear();
        this.notify('wordsChanged');
    }

    /**
     * 获取词语列表
     * @returns {string[]}
     */
    getWords() {
        return [...this.words];
    }

    /**
     * 获取词语数量
     * @returns {number}
     */
    getWordCount() {
        return this.words.length;
    }

    /**
     * 获取当前词语
     * @returns {string|null}
     */
    getCurrentWord() {
        if (this.currentIndex < 0 || this.currentIndex >= this.words.length) {
            return null;
        }
        return this.words[this.currentIndex];
    }

    // ========== 索引管理 ==========
    
    /**
     * 设置当前索引
     * @param {number} index
     */
    setCurrentIndex(index) {
        if (index < 0) index = 0;
        if (index >= this.words.length) index = this.words.length - 1;
        
        this.currentIndex = index;
        this.notify('currentIndexChanged');
    }
    
    /**
     * 设置准备阶段状态
     * @param {boolean} preparing
     */
    setPreparing(preparing) {
        this.isPreparing = preparing;
    }

    /**
     * 下一个词语
     * @returns {boolean} 是否还有下一个
     */
    next() {
        if (this.currentIndex < this.words.length - 1) {
            this.currentIndex++;
            this.notify('currentIndexChanged');
            return true;
        }
        return false;
    }

    /**
     * 上一个词语
     * @returns {boolean} 是否还有上一个
     */
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.notify('currentIndexChanged');
            return true;
        }
        return false;
    }

    /**
     * 重置到开始
     */
    reset() {
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.isPreparing = false;
        this.checkResults.clear();
        this.startTime = null;
        this.endTime = null;
        this.notify('currentIndexChanged');
        this.notify('playStateChanged');
    }

    // ========== 播放状态 ==========
    
    /**
     * 开始播放
     */
    start() {
        if (this.words.length === 0) return false;
        
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.notify('playStateChanged');
        return true;
    }

    /**
     * 暂停
     */
    pause() {
        this.isPaused = true;
        this.notify('playStateChanged');
    }

    /**
     * 继续
     */
    resume() {
        this.isPaused = false;
        this.notify('playStateChanged');
    }

    /**
     * 停止
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.endTime = Date.now();
        this.notify('playStateChanged');
    }

    /**
     * 完成提默
     */
    finish() {
        this.isPlaying = false;
        this.isPaused = false;
        this.endTime = Date.now();
        this.notify('playStateChanged');
    }

    /**
     * 获取播放状态
     */
    getPlayState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused
        };
    }

    // ========== 设置 ==========
    
    /**
     * 设置间隔时间
     * @param {number} seconds
     */
    setInterval(seconds) {
        this.interval = Math.max(3, Math.min(30, seconds));
        this.notify('settingsChanged');
    }

    /**
     * 获取间隔时间
     * @returns {number}
     */
    getInterval() {
        return this.interval;
    }

    /**
     * 设置是否显示词语
     * @param {boolean} show
     */
    setShowWord(show) {
        this.showWord = show;
        this.notify('settingsChanged');
    }

    /**
     * 获取是否显示词语
     * @returns {boolean}
     */
    getShowWord() {
        return this.showWord;
    }

    /**
     * 设置选中的语音
     * @param {SpeechSynthesisVoice} voice
     */
    setSelectedVoice(voice) {
        this.selectedVoice = voice;
        this.notify('settingsChanged');
    }

    /**
     * 获取选中的语音
     * @returns {SpeechSynthesisVoice|null}
     */
    getSelectedVoice() {
        return this.selectedVoice;
    }

    // ========== 检查结果 ==========
    
    /**
     * 设置检查结果
     * @param {number} index - 词语索引
     * @param {boolean} isCorrect - 是否正确
     */
    setCheckResult(index, isCorrect) {
        const word = this.words[index];
        if (!word) return;
        
        this.checkResults.set(index, isCorrect);
        this.notify('checkResultsChanged');
    }

    /**
     * 获取检查结果
     * @param {number} index
     * @returns {boolean|null}
     */
    getCheckResult(index) {
        return this.checkResults.get(index) ?? null;
    }

    /**
     * 获取所有检查结果
     * @returns {Map}
     */
    getAllCheckResults() {
        return new Map(this.checkResults);
    }

    /**
     * 获取统计信息
     * @returns {Object}
     */
    getStats() {
        const total = this.words.length;
        let correct = 0;
        let wrong = 0;
        
        this.checkResults.forEach((result) => {
            if (result) correct++;
            else wrong++;
        });
        
        const checked = correct + wrong;
        const rate = checked > 0 ? Math.round((correct / checked) * 100) : 0;
        
        return {
            total,
            correct,
            wrong,
            rate,
            duration: this.getDuration()
        };
    }

    /**
     * 获取用时（秒）
     * @returns {number}
     */
    getDuration() {
        if (!this.startTime) return 0;
        const end = this.endTime || Date.now();
        return Math.round((end - this.startTime) / 1000);
    }

    // ========== 事件监听 ==========
    
    /**
     * 添加监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * 移除监听器
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * 通知监听器
     * @param {string} event
     */
    notify(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback();
                } catch (e) {
                    console.error('State listener error:', e);
                }
            });
        }
    }
}

// 预设词库
const PRESETS = {
    numbers: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    weekdays: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    colors: ['红色', '橙色', '黄色', '绿色', '蓝色', '紫色', '黑色', '白色'],
    animals: ['猫', '狗', '鸟', '鱼', '兔子', '老虎', '狮子', '大象']
};

// 创建全局状态管理器实例
const state = new StateManager();
