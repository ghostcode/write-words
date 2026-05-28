/**
 * 语音识别模块
 * 封装 Web Speech API 的语音识别功能
 */

export type RecognitionResult = {
  final: string;
  interim: string;
  isFinal: boolean;
};

export type RecognitionError = {
  error: string;
  message: string;
};

export function createSpeechRecognizer() {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  return recognition as SpeechRecognition;
}

export function extractWords(text: string): string[] {
  if (!text) return [];
  let cleaned = text.trim();
  cleaned = cleaned.replace(/[，。？！,.?!]/g, ' ');
  return cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    'no-speech': '没有检测到语音，请再试一次',
    'audio-capture': '无法访问麦克风',
    'not-allowed': '麦克风权限被拒绝',
    'network': '网络错误，请检查网络连接',
    'aborted': '识别已取消',
  };
  return messages[error] || `识别出错: ${error}`;
}
