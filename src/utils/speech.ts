/**
 * 语音合成模块
 * 封装 Web Speech API 的语音合成功能
 */

export function useSpeechSynthesis() {
  const synth = window.speechSynthesis;

  const getVoices = (): SpeechSynthesisVoice[] => {
    return synth?.getVoices() ?? [];
  };

  const getChineseVoices = (): SpeechSynthesisVoice[] => {
    return getVoices().filter((v) =>
      v.lang.startsWith('zh') || v.lang.startsWith('cmn') || v.lang.startsWith('yue')
    );
  };

  const getEnglishVoices = (): SpeechSynthesisVoice[] => {
    return getVoices().filter((v) => v.lang.startsWith('en'));
  };

  const getBestVoice = (text: string): SpeechSynthesisVoice | null => {
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    const voices = getVoices();
    if (isChinese) {
      const chinese = getChineseVoices();
      if (chinese.length > 0) {
        return chinese.find((v) => v.localService) || chinese[0];
      }
    } else {
      const english = getEnglishVoices();
      if (english.length > 0) {
        return english.find((v) => v.localService) || english[0];
      }
    }
    return voices[0] || null;
  };

  const speak = (
    text: string,
    options: {
      voice?: SpeechSynthesisVoice | null;
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (event: SpeechSynthesisErrorEvent) => void;
    } = {}
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!synth) {
        resolve(false);
        return;
      }

      // 先取消之前的，但给一点缓冲时间让引擎重置
      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = options.voice || getBestVoice(text);
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;

        // 中文优化：设置 lang 确保引擎正确识别语言
        if (/[\u4e00-\u9fa5]/.test(text)) {
          utterance.lang = 'zh-CN';
        }

        let hasEnded = false;

        utterance.onstart = () => {
          options.onStart?.();
        };

        utterance.onend = () => {
          if (hasEnded) return;
          hasEnded = true;
          options.onEnd?.();
          resolve(true);
        };

        utterance.onerror = (event) => {
          if (hasEnded) return;
          hasEnded = true;
          // 忽略被取消的错误（这是我们主动调用的）
          if (event.error === 'canceled') {
            resolve(false);
            return;
          }
          options.onError?.(event);
          resolve(false);
        };

        // 边界事件：监听每个词/字的边界，可用于调试
        utterance.onboundary = (event) => {
          // 如果边界事件触发异常，可能是引擎在分段处理
          if (event.name === 'word' && event.elapsedTime > 0) {
            // 正常词边界
          }
        };

        synth.speak(utterance);
      };

      // 如果正在播放，先取消再延迟一点重新播放
      if (synth.speaking || synth.pending) {
        synth.cancel();
        // 小延迟确保引擎状态重置，避免卡顿
        setTimeout(doSpeak, 50);
      } else {
        doSpeak();
      }
    });
  };

  const stop = () => {
    synth?.cancel();
  };

  const getVoiceByName = (name: string): SpeechSynthesisVoice | null => {
    return getVoices().find((v) => v.name === name) || null;
  };

  return { speak, stop, getVoices, getChineseVoices, getEnglishVoices, getBestVoice, getVoiceByName };
}

export type SpeechEngine = ReturnType<typeof useSpeechSynthesis>;
