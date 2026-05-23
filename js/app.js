/**
 * 主应用模块 - App
 * 整合所有模块，实现完整的交互逻辑
 */

class App {
    constructor() {
        this.currentPage = 'input';
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * 设置应用
     */
    setup() {
        this.cacheElements();
        this.bindEvents();
        this.setupStateListeners();
        this.setupSpeechEngine();
        this.setupRecognizer();
        this.setupTimer();
        this.loadSettings();
        this.renderWordList();
        
        console.log('提默小助手已初始化');
    }

    /**
     * 缓存 DOM 元素
     */
    cacheElements() {
        // 页面
        this.pages = {
            input: document.getElementById('input-page'),
            dictation: document.getElementById('dictation-page'),
            check: document.getElementById('check-page')
        };

        // 输入页面元素
        this.wordInput = document.getElementById('word-input');
        this.addWordBtn = document.getElementById('add-word-btn');
        this.voiceInputBtn = document.getElementById('voice-input-btn');
        this.voiceStatus = document.getElementById('voice-status');
        this.stopVoiceBtn = document.getElementById('stop-voice-btn');
        this.toggleBatchBtn = document.getElementById('toggle-batch-btn');
        this.batchContainer = document.getElementById('batch-input-container');
        this.batchInput = document.getElementById('batch-input');
        this.addBatchBtn = document.getElementById('add-batch-btn');
        this.wordList = document.getElementById('word-list');
        this.emptyState = document.getElementById('empty-state');
        this.wordCount = document.getElementById('word-count');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        this.intervalSlider = document.getElementById('interval-slider');
        this.intervalValue = document.getElementById('interval-value');
        this.voiceSelect = document.getElementById('voice-select');
        this.showWordToggle = document.getElementById('show-word-toggle');
        this.startBtn = document.getElementById('start-btn');
        this.presetBtns = document.querySelectorAll('.btn-preset');

        // 提默页面元素
        this.exitBtn = document.getElementById('exit-btn');
        this.currentIndexEl = document.getElementById('current-index');
        this.totalCountEl = document.getElementById('total-count');
        this.progressFill = document.getElementById('progress-fill');
        this.currentWordEl = document.getElementById('current-word');
        this.countdownEl = document.getElementById('countdown');
        this.countdownNumber = this.countdownEl.querySelector('.countdown-number');
        this.prevBtn = document.getElementById('prev-btn');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.playLabel = document.getElementById('play-label');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.dictationStatus = document.getElementById('dictation-status');

        // 检查页面元素
        this.statTotal = document.getElementById('stat-total');
        this.statCorrect = document.getElementById('stat-correct');
        this.statWrong = document.getElementById('stat-wrong');
        this.statRate = document.getElementById('stat-rate');
        this.checkList = document.getElementById('check-list');
        this.restartBtn = document.getElementById('restart-btn');
        this.newSessionBtn = document.getElementById('new-session-btn');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 输入页面事件
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addWordFromInput();
            }
        });

        this.addWordBtn.addEventListener('click', () => this.addWordFromInput());
        
        this.voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.stopVoiceBtn.addEventListener('click', () => this.stopVoiceInput());
        
        this.toggleBatchBtn.addEventListener('click', () => this.toggleBatchInput());
        this.addBatchBtn.addEventListener('click', () => this.addBatchWords());
        
        this.clearAllBtn.addEventListener('click', () => this.clearAllWords());
        
        this.intervalSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            state.setInterval(value);
            this.intervalValue.textContent = value + '秒';
        });
        
        this.voiceSelect.addEventListener('change', (e) => {
            const voiceName = e.target.value;
            const voice = voiceName ? speechEngine.getVoiceByName(voiceName) : null;
            state.setSelectedVoice(voice);
            storage.updateSetting('selectedVoice', voiceName);
        });
        
        this.showWordToggle.addEventListener('change', (e) => {
            state.setShowWord(e.target.checked);
            storage.updateSetting('showWord', e.target.checked);
        });
        
        this.startBtn.addEventListener('click', () => this.startDictation());
        
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.loadPreset(preset);
            });
        });

        // 提默页面事件
        this.exitBtn.addEventListener('click', () => this.exitDictation());
        this.prevBtn.addEventListener('click', () => this.previousWord());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.repeatBtn.addEventListener('click', () => this.repeatCurrentWord());
        this.nextBtn.addEventListener('click', () => this.nextWord());

        // 检查页面事件
        this.restartBtn.addEventListener('click', () => this.restartDictation());
        this.newSessionBtn.addEventListener('click', () => this.newSession());
    }

    /**
     * 设置状态监听器
     */
    setupStateListeners() {
        state.on('wordsChanged', () => {
            this.renderWordList();
            this.updateStartButton();
        });

        state.on('currentIndexChanged', () => {
            this.updateDictationDisplay();
        });

        state.on('playStateChanged', () => {
            this.updatePlayButton();
        });
    }

    /**
     * 设置语音引擎
     */
    setupSpeechEngine() {
        // 等待语音列表加载
        speechEngine.onVoicesChanged = (voices) => {
            speechEngine.populateVoiceSelect(this.voiceSelect);
            
            // 恢复上次选择的语音
            const settings = storage.getSettings();
            if (settings.selectedVoice) {
                const voice = speechEngine.getVoiceByName(settings.selectedVoice);
                if (voice) {
                    this.voiceSelect.value = settings.selectedVoice;
                    state.setSelectedVoice(voice);
                }
            }
        };
    }

    /**
     * 设置语音识别
     */
    setupRecognizer() {
        // 检查支持
        if (!SpeechRecognizer.isSupported()) {
            this.voiceInputBtn.style.display = 'none';
            console.log('当前浏览器不支持语音识别');
            return;
        }

        // 设置回调
        speechRecognizer.onStart = () => {
            this.voiceStatus.classList.remove('hidden');
            this.voiceInputBtn.classList.add('active');
        };

        speechRecognizer.onEnd = () => {
            this.voiceStatus.classList.add('hidden');
            this.voiceInputBtn.classList.remove('active');
        };

        speechRecognizer.onResult = (result) => {
            if (result.isFinal && result.final) {
                const words = SpeechRecognizer.extractWords(result.final);
                words.forEach(word => state.addWord(word));
                
                // 显示识别结果提示
                this.showToast(`识别到: ${result.final}`);
            }
        };

        speechRecognizer.onError = (error) => {
            this.showToast(error.message, 'error');
            this.stopVoiceInput();
        };
    }

    /**
     * 设置计时器
     */
    setupTimer() {
        timerController.onCountdown = (value) => {
            if (value > 0) {
                this.countdownEl.classList.remove('hidden');
                this.countdownNumber.textContent = value;
            } else {
                this.countdownEl.classList.add('hidden');
            }
        };

        timerController.onInterval = (index) => {
            state.setCurrentIndex(index);
            this.speakCurrentWord();
        };

        timerController.onComplete = () => {
            state.finish();
            this.showCheckPage();
        };
    }

    /**
     * 加载设置
     */
    loadSettings() {
        const settings = storage.getSettings();
        
        // 间隔时间
        state.setInterval(settings.interval);
        this.intervalSlider.value = settings.interval;
        this.intervalValue.textContent = settings.interval + '秒';
        
        // 显示词语
        state.setShowWord(settings.showWord);
        this.showWordToggle.checked = settings.showWord;
    }

    // ========== 页面切换 ==========

    /**
     * 切换页面
     * @param {string} pageName
     */
    switchPage(pageName) {
        // 隐藏所有页面
        Object.values(this.pages).forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        if (this.pages[pageName]) {
            this.pages[pageName].classList.add('active');
            this.currentPage = pageName;
        }
    }

    // ========== 词语管理 ==========

    /**
     * 从输入框添加词语
     */
    addWordFromInput() {
        const word = this.wordInput.value.trim();
        if (!word) return;

        // 分割多个词语（用空格、逗号分隔）
        const words = word.split(/[\s,，]+/).filter(w => w.trim());
        
        if (words.length === 1) {
            if (state.addWord(words[0])) {
                this.wordInput.value = '';
                this.wordInput.focus();
            } else {
                this.showToast('该词语已存在', 'warning');
            }
        } else {
            const added = state.addWords(words);
            this.wordInput.value = '';
            this.showToast(`成功添加 ${added} 个词语`);
        }
    }

    /**
     * 切换语音输入
     */
    toggleVoiceInput() {
        if (speechRecognizer.getStatus()) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    /**
     * 开始语音输入
     */
    startVoiceInput() {
        if (speechRecognizer.start('zh-CN')) {
            this.showToast('请说出要添加的词语');
        }
    }

    /**
     * 停止语音输入
     */
    stopVoiceInput() {
        speechRecognizer.stop();
    }

    /**
     * 切换批量输入
     */
    toggleBatchInput() {
        this.batchContainer.classList.toggle('hidden');
        if (!this.batchContainer.classList.contains('hidden')) {
            this.batchInput.focus();
        }
    }

    /**
     * 批量添加词语
     */
    addBatchWords() {
        const text = this.batchInput.value.trim();
        if (!text) return;

        // 分割词语
        const words = text.split(/[\s,，。;；\n]+/).filter(w => w.trim());
        const added = state.addWords(words);
        
        if (added > 0) {
            this.batchInput.value = '';
            this.showToast(`成功添加 ${added} 个词语`);
        } else {
            this.showToast('没有新词语被添加', 'warning');
        }
    }

    /**
     * 清空所有词语
     */
    clearAllWords() {
        if (state.getWordCount() === 0) return;
        
        if (confirm('确定要清空所有词语吗？')) {
            state.clearAllWords();
            this.showToast('已清空所有词语');
        }
    }

    /**
     * 删除单个词语
     * @param {number} index
     */
    removeWord(index) {
        state.removeWord(index);
    }

    /**
     * 编辑词语
     * @param {number} index
     * @param {string} newWord
     */
    editWord(index, newWord) {
        if (!state.editWord(index, newWord)) {
            this.showToast('编辑失败，可能与其他词语重复', 'error');
        }
    }

    /**
     * 加载预设词库
     * @param {string} presetName
     */
    loadPreset(presetName) {
        const words = PRESETS[presetName];
        if (words) {
            state.addWords(words);
            this.showToast(`已加载预设词库`);
        }
    }

    /**
     * 渲染词语列表
     */
    renderWordList() {
        const words = state.getWords();
        const count = words.length;

        // 更新计数
        this.wordCount.textContent = `(${count}个)`;
        this.clearAllBtn.disabled = count === 0;

        // 清空列表
        this.wordList.innerHTML = '';

        if (count === 0) {
            // 显示空状态
            this.wordList.appendChild(this.emptyState);
            this.emptyState.style.display = 'block';
            return;
        }

        // 渲染词语项
        words.forEach((word, index) => {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.innerHTML = `
                <span class="word-number">${index + 1}</span>
                <span class="word-text">${this.escapeHtml(word)}</span>
                <div class="word-actions">
                    <button class="btn-word-action" data-action="edit" title="编辑">✏️</button>
                    <button class="btn-word-action" data-action="delete" title="删除">🗑️</button>
                </div>
            `;

            // 绑定事件
            const editBtn = item.querySelector('[data-action="edit"]');
            const deleteBtn = item.querySelector('[data-action="delete"]');

            editBtn.addEventListener('click', () => {
                this.enableEditMode(item, index, word);
            });

            deleteBtn.addEventListener('click', () => {
                this.removeWord(index);
            });

            this.wordList.appendChild(item);
        });
    }

    /**
     * 启用编辑模式
     * @param {HTMLElement} item
     * @param {number} index
     * @param {string} word
     */
    enableEditMode(item, index, word) {
        item.classList.add('editing');
        item.innerHTML = `
            <span class="word-number">${index + 1}</span>
            <input type="text" class="edit-input" value="${this.escapeHtml(word)}" />
            <div class="word-actions">
                <button class="btn-word-action" data-action="save" title="保存">✓</button>
                <button class="btn-word-action" data-action="cancel" title="取消">✕</button>
            </div>
        `;

        const input = item.querySelector('.edit-input');
        const saveBtn = item.querySelector('[data-action="save"]');
        const cancelBtn = item.querySelector('[data-action="cancel"]');

        input.focus();
        input.select();

        const save = () => {
            this.editWord(index, input.value);
        };

        const cancel = () => {
            this.renderWordList();
        };

        saveBtn.addEventListener('click', save);
        cancelBtn.addEventListener('click', cancel);

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.activeElement !== saveBtn && 
                    document.activeElement !== cancelBtn) {
                    cancel();
                }
            }, 200);
        });
    }

    /**
     * 更新开始按钮状态
     */
    updateStartButton() {
        this.startBtn.disabled = state.getWordCount() === 0;
    }

    // ========== 提默功能 ==========

    /**
     * 开始提默
     */
    startDictation() {
        if (state.getWordCount() === 0) return;

        // 重置状态
        state.reset();
        state.setPreparing(true); // 设置为准备阶段
        
        // 切换到提默页面
        this.switchPage('dictation');
        
        // 初始化进度显示（倒计时阶段）
        const totalCount = state.getWordCount();
        this.currentIndexEl.textContent = '0';
        this.totalCountEl.textContent = totalCount;
        this.progressFill.style.width = '0%';
        this.currentWordEl.textContent = '准备开始';
        this.currentWordEl.style.opacity = '1';
        this.countdownEl.classList.add('hidden');
        this.dictationStatus.textContent = '即将开始...';
        
        // 开始准备倒计时（3秒）
        this.startPreparationCountdown();
    }
    
    /**
     * 开始准备倒计时
     */
    startPreparationCountdown() {
        let countdown = 3;
        
        this.countdownEl.classList.remove('hidden');
        this.countdownNumber.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            
            if (countdown > 0) {
                this.countdownNumber.textContent = countdown;
            } else {
                // 倒计时结束
                clearInterval(countdownInterval);
                this.countdownEl.classList.add('hidden');
                
                // 开始提默
                state.setPreparing(false);
                state.start();
                timerController.setInterval(state.getInterval());
                timerController.start(state.getWordCount(), 0);
                
                this.updateDictationDisplay();
            }
        }, 1000);
    }

    /**
     * 更新提默显示
     */
    updateDictationDisplay() {
        const currentIndex = state.currentIndex;
        const totalCount = state.getWordCount();
        const currentWord = state.getCurrentWord();

        // 如果处于准备阶段，不更新进度和词语
        if (state.isPreparing) {
            this.currentIndexEl.textContent = '-';
            this.totalCountEl.textContent = totalCount;
            this.progressFill.style.width = '0%';
            return;
        }

        // 更新进度
        this.currentIndexEl.textContent = currentIndex + 1;
        this.totalCountEl.textContent = totalCount;
        this.progressFill.style.width = ((currentIndex + 1) / totalCount * 100) + '%';

        // 更新词语显示
        if (state.getShowWord()) {
            this.currentWordEl.textContent = currentWord || '';
            this.currentWordEl.style.opacity = '1';
        } else {
            this.currentWordEl.textContent = currentWord || '';
            this.currentWordEl.style.opacity = '0';
        }

        // 更新按钮状态
        this.prevBtn.disabled = currentIndex === 0;
        this.nextBtn.disabled = currentIndex >= totalCount - 1;

        // 朗读词语
        if (state.isPlaying && !state.isPaused) {
            this.speakCurrentWord();
        }
    }

    /**
     * 朗读当前词语
     */
    speakCurrentWord() {
        const word = state.getCurrentWord();
        if (!word) return;

        speechEngine.speak(word, {
            voice: state.getSelectedVoice(),
            onStart: () => {
                this.dictationStatus.textContent = '正在朗读...';
            },
            onEnd: () => {
                this.dictationStatus.textContent = '等待下一个...';
            }
        });
    }

    /**
     * 上一个词语
     */
    previousWord() {
        timerController.previous();
    }

    /**
     * 下一个词语
     */
    nextWord() {
        timerController.next();
    }

    /**
     * 重复当前词语
     */
    repeatCurrentWord() {
        this.speakCurrentWord();
    }

    /**
     * 切换播放/暂停
     */
    togglePlayPause() {
        if (state.isPaused) {
            state.resume();
            timerController.resume();
        } else {
            state.pause();
            timerController.pause();
        }
    }

    /**
     * 更新播放按钮
     */
    updatePlayButton() {
        if (state.isPaused) {
            this.playIcon.textContent = '▶️';
            this.playLabel.textContent = '继续';
            this.dictationStatus.textContent = '已暂停';
        } else {
            this.playIcon.textContent = '⏸';
            this.playLabel.textContent = '暂停';
            this.dictationStatus.textContent = '进行中...';
        }
    }

    /**
     * 退出提默
     */
    exitDictation() {
        if (confirm('确定要退出提默吗？')) {
            timerController.stop();
            speechEngine.stop();
            state.stop();
            this.switchPage('input');
        }
    }

    // ========== 检查页面 ==========

    /**
     * 显示检查页面
     */
    showCheckPage() {
        this.switchPage('check');
        this.renderCheckList();
        this.updateStats();
        
        // 保存记录
        const stats = state.getStats();
        storage.saveRecord({
            total: stats.total,
            correct: stats.correct,
            wrong: stats.wrong,
            rate: stats.rate,
            duration: stats.duration,
            words: state.getWords()
        });
    }

    /**
     * 渲染检查列表
     */
    renderCheckList() {
        const words = state.getWords();
        this.checkList.innerHTML = '';

        words.forEach((word, index) => {
            const item = document.createElement('div');
            item.className = 'check-item';
            item.dataset.index = index;

            const result = state.getCheckResult(index);
            if (result === true) {
                item.classList.add('correct');
            } else if (result === false) {
                item.classList.add('wrong');
            }

            item.innerHTML = `
                <span class="check-number">${index + 1}</span>
                <span class="check-word">${this.escapeHtml(word)}</span>
                <div class="check-actions-item">
                    <button class="btn btn-check btn-check-correct ${result === true ? 'selected' : ''}" data-result="true">
                        ✓ 对
                    </button>
                    <button class="btn btn-check btn-check-wrong ${result === false ? 'selected' : ''}" data-result="false">
                        ✕ 错
                    </button>
                </div>
            `;

            // 绑定事件
            const correctBtn = item.querySelector('[data-result="true"]');
            const wrongBtn = item.querySelector('[data-result="false"]');

            correctBtn.addEventListener('click', () => {
                state.setCheckResult(index, true);
                this.updateCheckItem(item, true);
                this.updateStats();
            });

            wrongBtn.addEventListener('click', () => {
                state.setCheckResult(index, false);
                this.updateCheckItem(item, false);
                this.updateStats();
            });

            this.checkList.appendChild(item);
        });
    }

    /**
     * 更新检查项状态
     * @param {HTMLElement} item
     * @param {boolean} isCorrect
     */
    updateCheckItem(item, isCorrect) {
        item.classList.remove('correct', 'wrong');
        item.classList.add(isCorrect ? 'correct' : 'wrong');

        const correctBtn = item.querySelector('[data-result="true"]');
        const wrongBtn = item.querySelector('[data-result="false"]');

        correctBtn.classList.toggle('selected', isCorrect === true);
        wrongBtn.classList.toggle('selected', isCorrect === false);
    }

    /**
     * 更新统计
     */
    updateStats() {
        const stats = state.getStats();
        this.statTotal.textContent = stats.total;
        this.statCorrect.textContent = stats.correct;
        this.statWrong.textContent = stats.wrong;
        this.statRate.textContent = stats.rate + '%';
    }

    /**
     * 重新开始
     */
    restartDictation() {
        state.reset();
        this.startDictation();
    }

    /**
     * 新的练习
     */
    newSession() {
        state.reset();
        this.switchPage('input');
    }

    // ========== 工具方法 ==========

    /**
     * 转义 HTML 特殊字符
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 显示提示消息
     * @param {string} message
     * @param {string} type
     */
    showToast(message, type = 'info') {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#4CAF50'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 16px;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(toast);

        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 启动应用
const app = new App();
