import { useState, useEffect, useCallback, useRef } from 'react';
import WordInput from './components/WordInput';
import DictationView from './components/DictationView';
import CheckView from './components/CheckView';
import ToastContainer from './components/Toast';
import { useDictation } from './hooks/useDictation';
import { useSpeechSynthesis, SpeechEngine } from './utils/speech';
import { getSettings, saveSettings, getLastWords, saveLastWords, saveRecord } from './utils/storage';

type Page = 'input' | 'dictation' | 'check';

export default function App() {
  const [page, setPage] = useState<Page>('input');
  const [words, setWords] = useState<string[]>([]);
  const [interval, setIntervalVal] = useState(8);
  const [showWord, setShowWord] = useState(true);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const speechEngine = useRef<SpeechEngine>(useSpeechSynthesis()).current;
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const dictation = useDictation(words, interval);

  // 初始化
  useEffect(() => {
    const settings = getSettings();
    setIntervalVal(settings.interval);
    setShowWord(settings.showWord);
    if (settings.selectedVoice) {
      setSelectedVoiceName(settings.selectedVoice);
    }
    // 恢复上次的词语
    const lastWords = getLastWords();
    if (lastWords.length > 0) {
      setWords(lastWords);
    }
  }, []);

  // 加载语音列表
  useEffect(() => {
    const loadVoices = () => {
      const v = speechEngine.getVoices();
      setVoices(v);
      if (selectedVoiceName) {
        selectedVoiceRef.current = speechEngine.getVoiceByName(selectedVoiceName) || null;
      }
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, [speechEngine, selectedVoiceName]);

  // 保存设置 - 使用 ref 确保保存最新值
  const settingsRef = useRef({ interval, showWord, selectedVoice: selectedVoiceName });
  settingsRef.current = { interval, showWord, selectedVoice: selectedVoiceName };

  const persistSettings = useCallback(() => {
    saveSettings(settingsRef.current);
  }, []);

  // 词语管理（新词插入到前面）
  const addWord = useCallback((word: string): boolean => {
    const trimmed = word.trim();
    if (!trimmed) return false;
    let added = false;
    setWords((prev) => {
      if (prev.includes(trimmed)) return prev;
      added = true;
      const next = [trimmed, ...prev];
      saveLastWords(next);
      return next;
    });
    return added;
  }, []);

  const addWords = useCallback((newWords: string[]): number => {
    let count = 0;
    setWords((prev) => {
      const uniqueNew: string[] = [];
      newWords.forEach((w) => {
        const trimmed = w.trim();
        if (trimmed && !prev.includes(trimmed) && !uniqueNew.includes(trimmed)) {
          uniqueNew.push(trimmed);
          count++;
        }
      });
      const next = [...uniqueNew, ...prev];
      saveLastWords(next);
      return next;
    });
    return count;
  }, []);

  const removeWord = useCallback((index: number) => {
    setWords((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveLastWords(next);
      return next;
    });
  }, []);

  const editWord = useCallback((index: number, newWord: string): boolean => {
    const trimmed = newWord.trim();
    if (!trimmed) return false;
    let success = false;
    setWords((prev) => {
      if (prev[index] === trimmed) return prev;
      const otherIndex = prev.findIndex((w, i) => w === trimmed && i !== index);
      if (otherIndex !== -1) return prev;
      const next = [...prev];
      next[index] = trimmed;
      saveLastWords(next);
      success = true;
      return next;
    });
    return success;
  }, []);

  const clearAllWords = useCallback(() => {
    setWords([]);
    saveLastWords([]);
  }, []);

  // 提默控制
  const startDictation = useCallback(() => {
    if (words.length === 0) return;
    dictation.start();
    setPage('dictation');
  }, [words, dictation]);

  const handleFinish = useCallback(() => {
    dictation.finish();
    const stats = dictation.getStats();
    saveRecord({
      total: stats.total,
      correct: stats.correct,
      wrong: stats.wrong,
      rate: stats.rate,
      duration: stats.duration,
      words,
    });
    setPage('check');
  }, [dictation, words]);

  const handleExit = useCallback(() => {
    speechEngine.stop();
    dictation.exit();
    setPage('input');
  }, [speechEngine, dictation]);

  const handleRestart = useCallback(() => {
    dictation.reset();
    dictation.start();
    setPage('dictation');
  }, [dictation]);

  const handleNewSession = useCallback(() => {
    dictation.reset();
    setPage('input');
  }, [dictation]);

  // 重复当前词语
  const handleRepeat = useCallback(() => {
    const word = words[dictation.currentIndex];
    if (word) {
      speechEngine.speak(word, { voice: selectedVoiceRef.current });
    }
  }, [words, dictation.currentIndex, speechEngine]);

  // 设置变更
  const handleIntervalChange = useCallback((value: number) => {
    setIntervalVal(value);
    persistSettings();
  }, [persistSettings]);

  const handleShowWordChange = useCallback((value: boolean) => {
    setShowWord(value);
    persistSettings();
  }, [persistSettings]);

  const handleVoiceChange = useCallback((name: string) => {
    setSelectedVoiceName(name || null);
    selectedVoiceRef.current = name ? speechEngine.getVoiceByName(name) : null;
    persistSettings();
  }, [speechEngine, persistSettings]);

  return (
    <div id="app">
      {page === 'input' && (
        <WordInput
          words={words}
          onAddWord={addWord}
          onAddWords={addWords}
          onRemoveWord={removeWord}
          onEditWord={editWord}
          onClearAll={clearAllWords}
          onStartDictation={startDictation}
          interval={interval}
          onIntervalChange={handleIntervalChange}
          showWord={showWord}
          onShowWordChange={handleShowWordChange}
          selectedVoice={selectedVoiceName}
          onVoiceChange={handleVoiceChange}
          voices={voices}
          existingWords={words}
        />
      )}

      {page === 'dictation' && (
        <DictationView
          state={dictation.state}
          currentIndex={dictation.currentIndex}
          countdown={dictation.countdown}
          words={words}
          totalWords={words.length}
          showWord={showWord}
          isPaused={dictation.state === 'paused'}
          onExit={handleExit}
          onPrev={dictation.prev}
          onNext={dictation.next}
          onTogglePlayPause={() => {
            if (dictation.state === 'paused') dictation.resume();
            else dictation.pause();
          }}
          onRepeat={handleRepeat}
          speechEngine={speechEngine}
          selectedVoice={selectedVoiceRef.current}
          onFinish={handleFinish}
          interval={interval}
        />
      )}

      {page === 'check' && (
        <CheckView
          words={words}
          checkResults={dictation.checkResults}
          onSetCheckResult={dictation.setCheckResult}
          stats={dictation.getStats()}
          onRestart={handleRestart}
          onNewSession={handleNewSession}
        />
      )}

      <ToastContainer />
    </div>
  );
}
