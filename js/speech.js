/**
 * 语音合成模块 - SpeechEngine
 * 封装 Web Speech API 的语音合成功能
 */

class SpeechEngine {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.isReady = false;
        this.onVoicesChanged = null;
        
        // 初始化
        this.init();
    }

    /**
     * 初始化语音引擎
     */
    init() {
        if (!this.synth) {
            console.warn('当前浏览器不支持语音合成功能');
            return;
        }

        // 加载语音列表
        this.loadVoices();

        // 监听语音列表变化（Chrome 需要）
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }

    /**
     * 加载可用语音列表
     */
    loadVoices() {
        this.voices = this.synth.getVoices();
        this.isReady = true;
        
        if (this.onVoicesChanged) {
            this.onVoicesChanged(this.voices);
        }
    }

    /**
     * 获取所有可用语音
     * @returns {SpeechSynthesisVoice[]}
     */
    getVoices() {
        return this.voices;
    }

    /**
     * 获取中文语音
     * @returns {SpeechSynthesisVoice[]}
     */
    getChineseVoices() {
        return this.voices.filter(voice => 
            voice.lang.startsWith('zh') || 
            voice.lang.startsWith('cmn') ||
            voice.lang.startsWith('yue')
        );
    }

    /**
     * 获取英文语音
     * @returns {SpeechSynthesisVoice[]}
     */
    getEnglishVoices() {
        return this.voices.filter(voice => 
            voice.lang.startsWith('en')
        );
    }

    /**
     * 根据语言获取最佳语音
     * @param {string} text - 要朗读的文本
     * @returns {SpeechSynthesisVoice|null}
     */
    getBestVoice(text) {
        // 检测文本语言
        const isChinese = /[\u4e00-\u9fa5]/.test(text);
        
        if (isChinese) {
            // 优先选择中文语音
            const chineseVoices = this.getChineseVoices();
            if (chineseVoices.length > 0) {
                // 优先选择本地语音
                const localVoice = chineseVoices.find(v => v.localService);
                return localVoice || chineseVoices[0];
            }
        } else {
            // 优先选择英文语音
            const englishVoices = this.getEnglishVoices();
            if (englishVoices.length > 0) {
                const localVoice = englishVoices.find(v => v.localService);
                return localVoice || englishVoices[0];
            }
        }

        // 返回默认语音
        return this.voices[0] || null;
    }

    /**
     * 朗读文本
     * @param {string} text - 要朗读的文本
     * @param {Object} options - 朗读选项
     * @returns {Promise<boolean>}
     */
    speak(text, options = {}) {
        return new Promise((resolve) => {
            if (!this.synth) {
                console.warn('语音合成不可用');
                resolve(false);
                return;
            }

            // 取消当前朗读
            this.synth.cancel();

            // 创建 utterance
            const utterance = new SpeechSynthesisUtterance(text);

            // 设置语音
            const voice = options.voice || this.getBestVoice(text);
            if (voice) {
                utterance.voice = voice;
            }

            // 设置参数
            utterance.rate = options.rate || 0.9; // 语速稍慢，适合儿童
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            // 事件处理
            utterance.onstart = () => {
                if (options.onStart) options.onStart();
            };

            utterance.onend = () => {
                if (options.onEnd) options.onEnd();
                resolve(true);
            };

            utterance.onerror = (event) => {
                console.error('语音合成错误:', event.error);
                if (options.onError) options.onError(event);
                resolve(false);
            };

            // 开始朗读
            this.synth.speak(utterance);
        });
    }

    /**
     * 停止朗读
     */
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    /**
     * 暂停朗读
     */
    pause() {
        if (this.synth) {
            this.synth.pause();
        }
    }

    /**
     * 继续朗读
     */
    resume() {
        if (this.synth) {
            this.synth.resume();
        }
    }

    /**
     * 检查是否正在朗读
     * @returns {boolean}
     */
    isSpeaking() {
        return this.synth ? this.synth.speaking : false;
    }

    /**
     * 检查是否暂停
     * @returns {boolean}
     */
    isPaused() {
        return this.synth ? this.synth.paused : false;
    }

    /**
     * 填充语音选择下拉框
     * @param {HTMLSelectElement} selectElement
     */
    populateVoiceSelect(selectElement) {
        // 清空现有选项
        selectElement.innerHTML = '<option value="">自动选择</option>';

        // 按语言分组
        const chineseVoices = this.getChineseVoices();
        const englishVoices = this.getEnglishVoices();
        const otherVoices = this.voices.filter(v => 
            !v.lang.startsWith('zh') && !v.lang.startsWith('cmn') && !v.lang.startsWith('en')
        );

        // 添加中文语音组
        if (chineseVoices.length > 0) {
            const zhGroup = document.createElement('optgroup');
            zhGroup.label = '中文语音';
            chineseVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})${voice.localService ? ' [本地]' : ''}`;
                zhGroup.appendChild(option);
            });
            selectElement.appendChild(zhGroup);
        }

        // 添加英文语音组
        if (englishVoices.length > 0) {
            const enGroup = document.createElement('optgroup');
            enGroup.label = '英文语音';
            englishVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})${voice.localService ? ' [本地]' : ''}`;
                enGroup.appendChild(option);
            });
            selectElement.appendChild(enGroup);
        }

        // 添加其他语音组
        if (otherVoices.length > 0) {
            const otherGroup = document.createElement('optgroup');
            otherGroup.label = '其他语音';
            otherVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                otherGroup.appendChild(option);
            });
            selectElement.appendChild(otherGroup);
        }
    }

    /**
     * 根据名称获取语音
     * @param {string} voiceName
     * @returns {SpeechSynthesisVoice|null}
     */
    getVoiceByName(voiceName) {
        return this.voices.find(v => v.name === voiceName) || null;
    }

    /**
     * 检查浏览器支持
     * @returns {boolean}
     */
    static isSupported() {
        return 'speechSynthesis' in window;
    }
}

// 创建全局语音引擎实例
const speechEngine = new SpeechEngine();
