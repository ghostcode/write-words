/**
 * 计时控制模块 - TimerController
 * 控制提默的计时和自动切换
 */

class TimerController {
    constructor() {
        this.interval = null;
        this.timeout = null;
        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = 0;
        this.currentInterval = 8000; // 默认8秒（毫秒）
        
        // 回调函数
        this.onTick = null; // 每秒触发
        this.onInterval = null; // 到达间隔触发
        this.onComplete = null; // 完成所有词语
        
        // 倒计时相关
        this.countdownValue = 0;
        this.countdownInterval = null;
        this.onCountdown = null;
    }

    /**
     * 设置间隔时间
     * @param {number} seconds - 间隔秒数
     */
    setInterval(seconds) {
        this.currentInterval = seconds * 1000;
    }

    /**
     * 开始提默
     * @param {number} totalWords - 总词数
     * @param {number} startIndex - 开始索引
     */
    start(totalWords, startIndex = 0) {
        if (this.isRunning) return false;
        
        this.isRunning = true;
        this.isPaused = false;
        this.totalWords = totalWords;
        this.currentIndex = startIndex;
        
        // 直接开始提默（不再有倒计时，倒计时由 app.js 处理）
        this.runInterval();
        
        return true;
    }

    /**
     * 开始倒计时
     * @param {number} seconds - 倒计时秒数
     * @param {Function} callback - 倒计时结束回调
     */
    startCountdown(seconds, callback) {
        this.countdownValue = seconds;
        
        if (this.onCountdown) {
            this.onCountdown(this.countdownValue);
        }
        
        this.countdownInterval = setInterval(() => {
            this.countdownValue--;
            
            if (this.onCountdown) {
                this.onCountdown(this.countdownValue);
            }
            
            if (this.countdownValue <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                if (callback) callback();
            }
        }, 1000);
    }

    /**
     * 停止倒计时
     */
    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    /**
     * 运行间隔循环
     */
    runInterval() {
        if (!this.isRunning || this.isPaused) return;
        
        // 触发间隔事件
        if (this.onInterval) {
            this.onInterval(this.currentIndex);
        }
        
        // 检查是否完成
        if (this.currentIndex >= this.totalWords - 1) {
            // 最后一个词语，等待间隔后结束
            this.timeout = setTimeout(() => {
                if (this.isRunning && !this.isPaused) {
                    this.complete();
                }
            }, this.currentInterval);
            return;
        }
        
        // 设置下一个词语的定时器
        this.timeout = setTimeout(() => {
            if (this.isRunning && !this.isPaused) {
                this.currentIndex++;
                this.runInterval();
            }
        }, this.currentInterval);
    }

    /**
     * 暂停
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        
        // 清除定时器
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    /**
     * 继续
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        
        // 继续当前词语的间隔
        this.runInterval();
    }

    /**
     * 停止
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        // 清除所有定时器
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        this.stopCountdown();
    }

    /**
     * 完成
     */
    complete() {
        this.stop();
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * 跳转到指定索引
     * @param {number} index
     */
    jumpTo(index) {
        if (index < 0 || index >= this.totalWords) return;
        
        this.currentIndex = index;
        
        // 如果正在运行，重新设置定时器
        if (this.isRunning && !this.isPaused) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.runInterval();
        }
    }

    /**
     * 下一个
     */
    next() {
        if (this.currentIndex < this.totalWords - 1) {
            this.jumpTo(this.currentIndex + 1);
        }
    }

    /**
     * 上一个
     */
    previous() {
        if (this.currentIndex > 0) {
            this.jumpTo(this.currentIndex - 1);
        }
    }

    /**
     * 获取当前状态
     * @returns {Object}
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentIndex: this.currentIndex,
            totalWords: this.totalWords,
            countdown: this.countdownValue
        };
    }

    /**
     * 获取当前索引
     * @returns {number}
     */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /**
     * 检查是否正在运行
     * @returns {boolean}
     */
    isActive() {
        return this.isRunning;
    }

    /**
     * 检查是否暂停
     * @returns {boolean}
     */
    isPausedState() {
        return this.isPaused;
    }
}

// 创建全局计时控制器实例
const timerController = new TimerController();
