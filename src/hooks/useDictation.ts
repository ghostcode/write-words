import { useState, useCallback, useRef, useEffect } from 'react';

export type DictationState = 'idle' | 'preparing' | 'running' | 'paused' | 'finished';

export function useDictation(words: string[], interval: number) {
  const [state, setState] = useState<DictationState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [checkResults, setCheckResults] = useState<Map<number, boolean>>(new Map());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // 开始提默
  const start = useCallback(() => {
    if (words.length === 0) return;
    clearTimers();
    setCurrentIndex(0);
    setCheckResults(new Map());
    setStartTime(null);
    setEndTime(null);
    setState('preparing');

    let count = 3;
    setCountdown(count);

    countdownRef.current = window.setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        if (countdownRef.current !== null) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setCountdown(0);
        setState('running');
        setStartTime(Date.now());
      }
    }, 1000);
  }, [words, clearTimers]);

  // 暂停
  const pause = useCallback(() => {
    if (state !== 'running') return;
    clearTimers();
    setState('paused');
  }, [state, clearTimers]);

  // 继续
  const resume = useCallback(() => {
    if (state !== 'paused') return;
    setState('running');
  }, [state]);

  // 下一个
  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < words.length - 1) return prev + 1;
      return prev;
    });
  }, [words.length]);

  // 上一个
  const prev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) return prev - 1;
      return prev;
    });
  }, []);

  // 完成
  const finish = useCallback(() => {
    clearTimers();
    setState('finished');
    setEndTime(Date.now());
  }, [clearTimers]);

  // 退出
  const exit = useCallback(() => {
    clearTimers();
    setState('idle');
    setCurrentIndex(0);
    setCountdown(0);
  }, [clearTimers]);

  // 设置检查结果
  const setCheckResult = useCallback((index: number, isCorrect: boolean) => {
    setCheckResults((prev) => {
      const next = new Map(prev);
      next.set(index, isCorrect);
      return next;
    });
  }, []);

  // 重置
  const reset = useCallback(() => {
    clearTimers();
    setState('idle');
    setCurrentIndex(0);
    setCountdown(0);
    setCheckResults(new Map());
    setStartTime(null);
    setEndTime(null);
  }, [clearTimers]);

  // 获取统计
  const getStats = useCallback(() => {
    const total = words.length;
    let correct = 0;
    let wrong = 0;
    checkResults.forEach((result) => {
      if (result) correct++;
      else wrong++;
    });
    const checked = correct + wrong;
    const rate = checked > 0 ? Math.round((correct / checked) * 100) : 0;
    const duration = startTime
      ? Math.round(((endTime || Date.now()) - startTime) / 1000)
      : 0;
    return { total, correct, wrong, rate, duration };
  }, [words.length, checkResults, startTime, endTime]);

  return {
    state,
    currentIndex,
    countdown,
    checkResults,
    startTime,
    endTime,
    start,
    pause,
    resume,
    next,
    prev,
    finish,
    exit,
    reset,
    setCheckResult,
    getStats,
  };
}
