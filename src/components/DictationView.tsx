import { useEffect, useRef, useCallback, useState } from 'react';
import { DictationState } from '../hooks/useDictation';
import { SpeechEngine } from '../utils/speech';
import ConfirmDialog from './ConfirmDialog';

interface DictationViewProps {
  state: DictationState;
  currentIndex: number;
  countdown: number;
  words: string[];
  totalWords: number;
  showWord: boolean;
  isPaused: boolean;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlayPause: () => void;
  onRepeat: () => void;
  speechEngine: SpeechEngine;
  selectedVoice: SpeechSynthesisVoice | null;
  onFinish: () => void;
  interval: number;
}

export default function DictationView({
  state,
  currentIndex,
  countdown,
  words,
  totalWords,
  showWord,
  isPaused,
  onExit,
  onPrev,
  onNext,
  onTogglePlayPause,
  onRepeat,
  speechEngine,
  selectedVoice,
  onFinish,
  interval,
}: DictationViewProps) {
  const timeoutRef = useRef<number | null>(null);
  const hasStarted = useRef(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const speakWord = useCallback(
    (word: string): Promise<boolean> => {
      return speechEngine.speak(word, { voice: selectedVoice });
    },
    [speechEngine, selectedVoice]
  );

  // 处理运行状态：每个词朗读 + 间隔后自动切换
  const stateRef = useRef(state);
  stateRef.current = state;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const wordsRef = useRef(words);
  wordsRef.current = words;
  const totalWordsRef = useRef(totalWords);
  totalWordsRef.current = totalWords;
  const intervalRef = useRef(interval);
  intervalRef.current = interval;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const speakWordRef = useRef(speakWord);
  speakWordRef.current = speakWord;

  // 跟踪上一个 currentIndex，用于检测切换
  const lastIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (state !== 'running') {
      hasStarted.current = false;
      return;
    }

    // 如果索引变化了，重置 hasStarted 以触发新词的朗读
    if (currentIndex !== lastIndexRef.current) {
      hasStarted.current = false;
      lastIndexRef.current = currentIndex;
    }

    if (!hasStarted.current) {
      hasStarted.current = true;
      // 朗读当前词，等待朗读完成后再开始间隔计时
      speakWordRef.current(wordsRef.current[currentIndexRef.current]).then(() => {
        // 语音播放完成后，再开始间隔计时
        // 但如果状态已经改变（比如用户暂停了），就不继续
        if (stateRef.current !== 'running') return;

        const isLast = currentIndexRef.current >= totalWordsRef.current - 1;

        if (isLast) {
          timeoutRef.current = window.setTimeout(() => {
            onFinishRef.current();
          }, intervalRef.current * 1000);
        } else {
          timeoutRef.current = window.setTimeout(() => {
            onNextRef.current();
          }, intervalRef.current * 1000);
        }
      });
    }

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [state, currentIndex]);

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isPreparing = state === 'preparing';
  const progressWidth = isPreparing
    ? '0%'
    : `${((currentIndex + 1) / totalWords) * 100}%`;

  const currentDisplay = isPreparing ? '0' : String(currentIndex + 1);

  return (
    <div className="page active">
      <div className="dictation-container">
        {/* 顶部进度栏 */}
        <div className="dictation-header">
          <button
            className="btn btn-icon btn-exit"
            title="退出"
            onClick={() => setExitConfirmOpen(true)}
          >
            <span>✕</span>
          </button>
          <div className="progress-info">
            {currentDisplay} / {totalWords}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="dictation-content">
          <div className="word-display">
            {isPreparing ? (
              <span className="current-word">准备开始</span>
            ) : (
              <span
                className="current-word"
                style={{ opacity: showWord ? 1 : 0 }}
              >
                {words[currentIndex] || ''}
              </span>
            )}
          </div>

          {isPreparing && (
            <div className="countdown">
              <span className="countdown-number">{countdown}</span>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="dictation-controls">
          <button
            className="btn btn-control"
            disabled={currentIndex === 0 || isPreparing}
            onClick={onPrev}
          >
            <span>⏮</span>
            <span className="control-label">上一个</span>
          </button>

          <button
            className="btn btn-control btn-play"
            disabled={isPreparing}
            onClick={onTogglePlayPause}
          >
            <span>{isPaused ? '▶️' : '⏸'}</span>
            <span className="control-label">{isPaused ? '继续' : '暂停'}</span>
          </button>

          <button
            className="btn btn-control"
            disabled={isPreparing}
            onClick={onRepeat}
          >
            <span>🔁</span>
            <span className="control-label">重复</span>
          </button>

          <button
            className="btn btn-control"
            disabled={currentIndex >= totalWords - 1 || isPreparing}
            onClick={onNext}
          >
            <span>⏭</span>
            <span className="control-label">下一个</span>
          </button>
        </div>

        {/* 状态提示 */}
        <div className="dictation-status">
          {isPreparing
            ? '即将开始...'
            : isPaused
              ? '已暂停'
              : '进行中...'}
        </div>
      </div>

      {/* 退出确认对话框 */}
      <ConfirmDialog
        isOpen={exitConfirmOpen}
        title="退出确认"
        message="确定要退出提默吗？"
        confirmText="退出"
        cancelText="继续"
        onConfirm={() => {
          onExit();
          setExitConfirmOpen(false);
        }}
        onCancel={() => setExitConfirmOpen(false)}
      />
    </div>
  );
}
