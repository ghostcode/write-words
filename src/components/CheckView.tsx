import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  getErrorMessage,
} from '../utils/recognizer';
import { showToast } from './Toast';

interface CheckViewProps {
  words: string[];
  checkResults: Map<number, boolean>;
  onSetCheckResult: (index: number, isCorrect: boolean) => void;
  stats: { total: number; correct: number; wrong: number; rate: number };
  onRestart: () => void;
  onNewSession: () => void;
}

export default function CheckView({
  words,
  checkResults,
  onSetCheckResult,
  stats,
  onRestart,
  onNewSession,
}: CheckViewProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = words.findIndex((_, i) => !checkResults.has(i));
  if (currentIndexRef.current === -1) currentIndexRef.current = words.length;

  const processVoiceCommand = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;

      // 找到第一个未检查的词语索引
      const idx = words.findIndex((_, i) => !checkResults.has(i));
      if (idx === -1) {
        showToast('所有词语已检查完毕');
        return;
      }

      // 识别"对/正确/是/好"或"错/错误/否/不对"
      const correctPattern = /^(对|正确|是|好|没错|对了|正确)$/;
      const wrongPattern = /^(错|错误|否|不对|错了|错误)$/;

      if (correctPattern.test(t)) {
        onSetCheckResult(idx, true);
        showToast(`第 ${idx + 1} 个: ✓ 正确`);
      } else if (wrongPattern.test(t)) {
        onSetCheckResult(idx, false);
        showToast(`第 ${idx + 1} 个: ✕ 错误`);
      } else {
        showToast(`未识别指令: "${t}"，请说"对"或"错"`);
      }
    },
    [words, checkResults, onSetCheckResult]
  );

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    const recognition = createSpeechRecognizer();
    if (!recognition) return;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      if (interimTranscript) {
        setInterimText(interimTranscript.trim());
      }
      if (finalTranscript.trim()) {
        processVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      showToast(getErrorMessage(event.error), 'error');
      setIsListening(false);
    };

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [processVoiceCommand]);

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      showToast('当前浏览器不支持语音识别', 'error');
      return;
    }
    if (isListening) {
      rec.stop();
    } else {
      try {
        rec.start();
      } catch {
        showToast('语音识别启动失败', 'error');
      }
    }
  };
  return (
    <div className="page active">
      <div className="container">
        <header className="header">
          <div className="logo">✅</div>
          <h1>检查答案</h1>
          <p className="subtitle">对照正确答案，标记默写结果</p>
        </header>

        {/* 统计信息 */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总词数</div>
          </div>
          <div className="stat-card stat-correct">
            <div className="stat-value">{stats.correct}</div>
            <div className="stat-label">正确</div>
          </div>
          <div className="stat-card stat-wrong">
            <div className="stat-value">{stats.wrong}</div>
            <div className="stat-label">错误</div>
          </div>
          <div className="stat-card stat-rate">
            <div className="stat-value">{stats.rate}%</div>
            <div className="stat-label">正确率</div>
          </div>
        </div>

        {/* 语音检查 */}
        {isSpeechRecognitionSupported() && (
          <div className="voice-check-section" style={{ marginBottom: 16, textAlign: 'center' }}>
            <button
              className={`btn btn-large ${isListening ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleListening}
            >
              <span>{isListening ? '🎙️' : '🎤'}</span>
              {isListening ? '停止语音检查' : '语音检查'}
            </button>
            {isListening && (
              <div style={{ marginTop: 8 }}>
                <div className="voice-indicator" style={{ justifyContent: 'center' }}>
                  <span className="voice-wave" />
                  <span className="voice-wave" />
                  <span className="voice-wave" />
                </div>
                <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
                  正在聆听... 请说"对"或"错"
                </p>
                {interimText && (
                  <p style={{ color: '#999', fontSize: 13, marginTop: 2 }}>
                    识别中: {interimText}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 词语检查列表 */}
        <div className="check-list-section">
          <h3>词语对照表</h3>
          <div className="check-list">
            {words.map((word, index) => {
              const result = checkResults.get(index);
              const isCorrect = result === true;
              const isWrong = result === false;
              return (
                <div
                  key={`${word}-${index}`}
                  className={`check-item ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                >
                  <span className="check-number">{index + 1}</span>
                  <span className="check-word">{word}</span>
                  <div className="check-actions-item">
                    <button
                      className={`btn btn-check btn-check-correct ${isCorrect ? 'selected' : ''}`}
                      onClick={() => onSetCheckResult(index, true)}
                    >
                      ✓ 对
                    </button>
                    <button
                      className={`btn btn-check btn-check-wrong ${isWrong ? 'selected' : ''}`}
                      onClick={() => onSetCheckResult(index, false)}
                    >
                      ✕ 错
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="check-actions">
          <button className="btn btn-large btn-primary" onClick={onRestart}>
            <span>🔄</span>
            再练一次
          </button>
          <button className="btn btn-large btn-success" onClick={onNewSession}>
            <span>📝</span>
            新的练习
          </button>
        </div>
      </div>
    </div>
  );
}
