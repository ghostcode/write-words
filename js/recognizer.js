/**
 * 语音识别模块 - SpeechRecognizer
 * 封装 Web Speech API 的语音识别功能
 */

class SpeechRecognizer {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = this.checkSupport();
        
        // 回调函数
        this.onResult = null;
        this.onError = null;
        this.onStart = null;
        this.onEnd = null;
        
        // 初始化
        if (this.isSupported) {
            this.init();
        }
    }

    /**
     * 检查浏览器支持
     * @returns {boolean}
     */
    checkSupport() {
        return 'webkitSpeechRecognition' in window || 
               'SpeechRecognition' in window;
    }

    /**
     * 初始化语音识别
     */
    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // 配置
        this.recognition.continuous = true; // 持续识别
        this.recognition.interimResults = true; // 返回临时结果
        this.recognition.lang = 'zh-CN'; // 默认中文
        
        // 事件绑定
        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStart) this.onStart();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        };
        
        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.handleError(event);
        };
    }

    /**
     * 处理识别结果
     * @param {SpeechRecognitionEvent} event
     */
    handleResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (this.onResult) {
            this.onResult({
                final: finalTranscript.trim(),
                interim: interimTranscript.trim(),
                isFinal: finalTranscript.length > 0
            });
        }
    }

    /**
     * 处理错误
     * @param {SpeechRecognitionErrorEvent} event
     */
    handleError(event) {
        let message = '';
        
        switch (event.error) {
            case 'no-speech':
                message = '没有检测到语音，请再试一次';
                break;
            case 'audio-capture':
                message = '无法访问麦克风';
                break;
            case 'not-allowed':
                message = '麦克风权限被拒绝';
                break;
            case 'network':
                message = '网络错误，请检查网络连接';
                break;
            case 'aborted':
                message = '识别已取消';
                break;
            default:
                message = '识别出错: ' + event.error;
        }
        
        if (this.onError) {
            this.onError({
                error: event.error,
                message: message
            });
        }
    }

    /**
     * 开始识别
     * @param {string} lang - 语言代码 (zh-CN, en-US 等)
     * @returns {boolean}
     */
    start(lang = 'zh-CN') {
        if (!this.isSupported || !this.recognition) {
            if (this.onError) {
                this.onError({
                    error: 'not-supported',
                    message: '当前浏览器不支持语音识别功能'
                });
            }
            return false;
        }
        
        if (this.isListening) {
            return true;
        }
        
        try {
            this.recognition.lang = lang;
            this.recognition.start();
            return true;
        } catch (e) {
            console.error('语音识别启动失败:', e);
            if (this.onError) {
                this.onError({
                    error: 'start-failed',
                    message: '语音识别启动失败'
                });
            }
            return false;
        }
    }

    /**
     * 停止识别
     */
    stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.error('停止识别失败:', e);
            }
        }
    }

    /**
     * 中止识别
     */
    abort() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.abort();
            } catch (e) {
                console.error('中止识别失败:', e);
            }
        }
    }

    /**
     * 获取识别状态
     * @returns {boolean}
     */
    getStatus() {
        return this.isListening;
    }

    /**
     * 设置语言
     * @param {string} lang
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * 处理识别文本，提取词语
     * @param {string} text - 识别的原始文本
     * @returns {string[]} - 提取的词语数组
     */
    static extractWords(text) {
        if (!text) return [];
        
        // 清理文本
        let cleaned = text.trim();
        
        // 移除标点符号
        cleaned = cleaned.replace(/[，。？！,.?!]/g, ' ');
        
        // 分割成词语
        const words = cleaned
            .split(/\s+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);
        
        return words;
    }

    /**
     * 获取支持的语言列表
     * @returns {Array<{code: string, name: string}>}
     */
    static getSupportedLanguages() {
        return [
            { code: 'zh-CN', name: '中文（普通话）' },
            { code: 'zh-HK', name: '中文（粤语）' },
            { code: 'zh-TW', name: '中文（台湾）' },
            { code: 'en-US', name: '英语（美国）' },
            { code: 'en-GB', name: '英语（英国）' },
            { code: 'ja-JP', name: '日语' },
            { code: 'ko-KR', name: '韩语' }
        ];
    }

    /**
     * 静态方法：检查支持
     * @returns {boolean}
     */
    static isSupported() {
        return 'webkitSpeechRecognition' in window || 
               'SpeechRecognition' in window;
    }
}

// 创建全局语音识别器实例
const speechRecognizer = new SpeechRecognizer();
