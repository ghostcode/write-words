import { useState, useRef, useEffect, useCallback } from 'react';
import { PRESETS } from '../utils/presets';
import ConfirmDialog from './ConfirmDialog';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  getErrorMessage,
} from '../utils/recognizer';
import { showToast } from './Toast';

interface WordInputProps {
  words: string[];
  onAddWord: (word: string) => boolean;
  onAddWords: (words: string[]) => number;
  onRemoveWord: (index: number) => void;
  onEditWord: (index: number, newWord: string) => boolean;
  onClearAll: () => void;
  onStartDictation: () => void;
  interval: number;
  onIntervalChange: (value: number) => void;
  showWord: boolean;
  onShowWordChange: (value: boolean) => void;
  selectedVoice: string | null;
  onVoiceChange: (voice: string) => void;
  voices: SpeechSynthesisVoice[];
}

export default function WordInput({
  words,
  onAddWord,
  onAddWords,
  onRemoveWord,
  onEditWord,
  onClearAll,
  onStartDictation,
  interval,
  onIntervalChange,
  showWord,
  onShowWordChange,
  selectedVoice,
  onVoiceChange,
  voices,
}: WordInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [batchValue, setBatchValue] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voiceConfirmOpen, setVoiceConfirmOpen] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/[\s,，]+/).filter((w) => w.trim());
    if (parts.length === 1) {
      onAddWord(parts[0]);
    } else {
      onAddWords(parts);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleBatchAdd = () => {
    const text = batchValue.trim();
    if (!text) return;
    const words = text.split(/[\s,，。;；\n]+/).filter((w) => w.trim());
    onAddWords(words);
    setBatchValue('');
  };

  const handleEditStart = (index: number, word: string) => {
    setEditingIndex(index);
    setEditValue(word);
  };

  const handleEditSave = (index: number) => {
    onEditWord(index, editValue);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  // 语音识别
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    const recognition = createSpeechRecognizer();
    if (!recognition) return;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsVoiceListening(true);
    };
    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognition.onresult = (event: any) => {
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
      if (finalTranscript.trim()) {
        // 停止识别，弹出确认框
        recognition.stop();
        setVoiceText(finalTranscript.trim());
        setVoiceConfirmOpen(true);
      }
    };

    recognition.onerror = (event: any) => {
      showToast(getErrorMessage(event.error), 'error');
      setIsVoiceListening(false);
    };

    return () => {
      try { recognition.abort(); } catch {}
    };
  }, []);

  const toggleVoiceInput = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      showToast('当前浏览器不支持语音识别功能', 'error');
      return;
    }
    if (isVoiceListening) {
      rec.stop();
    } else {
      try {
        rec.start();
        showToast('请说出要添加的词语');
      } catch {
        showToast('语音识别启动失败', 'error');
      }
    }
  }, [isVoiceListening]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleVoiceConfirm = () => {
    const trimmed = voiceText.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/[\s,，]+/).filter((w) => w.trim());
    if (parts.length === 1) {
      onAddWord(parts[0]);
    } else {
      onAddWords(parts);
    }
    setVoiceConfirmOpen(false);
    setVoiceText('');
  };

  const handleVoiceCancel = () => {
    setVoiceConfirmOpen(false);
    setVoiceText('');
    // 取消后继续识别
    setTimeout(() => {
      toggleVoiceInput();
    }, 300);
  };

  const chineseVoices = voices.filter(
    (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn') || v.lang.startsWith('yue')
  );
  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  const otherVoices = voices.filter(
    (v) => !v.lang.startsWith('zh') && !v.lang.startsWith('cmn') && !v.lang.startsWith('en')
  );

  return (
    <div className="page active">
      <div className="container">
        <header className="header">
          <div className="logo">📚</div>
          <h1>提默小助手</h1>
          <p className="subtitle">小学生字词默写练习工具</p>
        </header>

        {/* 词语输入 */}
        <div className="input-section">
          <div className="input-header">
            <h2>添加词语</h2>
            <div className="input-methods">
              <button className="btn-icon" title="语音输入" onClick={toggleVoiceInput}>
                <span className="icon">🎤</span>
                <span className="btn-text">语音</span>
              </button>
            </div>
          </div>

          <div className="text-input-area">
            <input
              ref={inputRef}
              type="text"
              className="word-input"
              placeholder="输入词语后按回车添加，支持批量粘贴"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoComplete="off"
            />
            <button className="btn btn-primary" onClick={handleAdd}>添加</button>
          </div>

          {/* 语音输入状态 */}
          {isVoiceListening && (
            <div className="voice-status">
              <div className="voice-indicator">
                <span className="voice-wave" />
                <span className="voice-wave" />
                <span className="voice-wave" />
              </div>
              <span className="voice-text">正在聆听...</span>
              <button className="btn btn-small btn-danger" onClick={stopVoiceInput}>停止</button>
            </div>
          )}

          {/* 批量粘贴 */}
          <div className="batch-input-area">
            <button className="btn btn-link" onClick={() => setShowBatch(!showBatch)}>
              + 批量粘贴
            </button>
            {showBatch && (
              <div className="batch-container">
                <textarea
                  className="batch-textarea"
                  placeholder="粘贴多个词语，用空格、逗号或换行分隔"
                  rows={4}
                  value={batchValue}
                  onChange={(e) => setBatchValue(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={handleBatchAdd}>批量添加</button>
              </div>
            )}
          </div>
        </div>

        {/* 词语列表 */}
        <div className="word-list-section">
          <div className="list-header">
            <h3>
              词语列表 <span className="word-count">({words.length}个)</span>
            </h3>
            <button
              className="btn btn-small btn-danger"
              disabled={words.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              清空全部
            </button>
          </div>
          <div className="word-list">
            {words.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>还没有添加词语</p>
                <p className="empty-hint">在上方输入词语开始练习吧</p>
              </div>
            ) : (
              words.map((word, index) => (
                <div
                  key={`${word}-${index}`}
                  className={`word-item ${editingIndex === index ? 'editing' : ''}`}
                >
                  {editingIndex === index ? (
                    <>
                      <span className="word-number">{index + 1}</span>
                      <input
                        className="edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(index);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        autoFocus
                        onBlur={handleEditCancel}
                      />
                      <div className="word-actions" style={{ opacity: 1 }}>
                        <button className="btn-word-action" onMouseDown={() => handleEditSave(index)}>✓</button>
                        <button className="btn-word-action" onMouseDown={handleEditCancel}>✕</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="word-number">{index + 1}</span>
                      <span className="word-text">{word}</span>
                      <div className="word-actions">
                        <button className="btn-word-action" onClick={() => handleEditStart(index, word)}>✏️</button>
                        <button className="btn-word-action" onClick={() => onRemoveWord(index)}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

        {/* 开始按钮 */}
        <div className="action-section" style={{ marginTop: 16 }}>
          <button
            className="btn btn-large btn-success"
            disabled={words.length === 0}
            onClick={onStartDictation}
          >
            <span className="btn-icon-large">▶️</span>
            开始提默
          </button>
        </div>
        
        {/* 设置 */}
        <div className="settings-section">
          <div className="setting-item">
            <label>提默间隔时间</label>
            <div className="slider-container">
              <input
                type="range"
                className="slider"
                min={3}
                max={30}
                step={1}
                value={interval}
                onChange={(e) => onIntervalChange(Number(e.target.value))}
              />
              <span className="interval-value">{interval}秒</span>
            </div>
          </div>

          <div className="setting-item">
            <label>朗读语音</label>
            <select
              className="voice-select"
              value={selectedVoice ?? ''}
              onChange={(e) => onVoiceChange(e.target.value)}
            >
              <option value="">默认语音</option>
              {chineseVoices.length > 0 && (
                <optgroup label="中文语音">
                  {chineseVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang}){v.localService ? ' [本地]' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {englishVoices.length > 0 && (
                <optgroup label="英文语音">
                  {englishVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang}){v.localService ? ' [本地]' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="其他语音">
                  {otherVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="setting-item checkbox-item">
            <input
              type="checkbox"
              className="checkbox"
              checked={showWord}
              onChange={(e) => onShowWordChange(e.target.checked)}
            />
            <label>提默时显示词语（用于跟读练习）</label>
          </div>
        </div>

        {/* 快速词库 */}
        <div className="preset-section">
          <h3>快速词库</h3>
          <div className="preset-buttons">
            {Object.entries(PRESETS).map(([key, value]) => (
              <button
                key={key}
                className="btn btn-preset"
                onClick={() => onAddWords(value)}
              >
                {key === 'numbers' && '数字 1-10'}
                {key === 'weekdays' && '星期'}
                {key === 'colors' && '颜色'}
                {key === 'animals' && '动物'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 清空确认对话框 */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="清空确认"
        message="确定要清空所有词语吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        onConfirm={() => {
          onClearAll();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* 语音识别确认对话框 */}
      {voiceConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleVoiceCancel();
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '24px 28px',
              minWidth: 320,
              maxWidth: '90vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#333' }}>
              确认识别结果
            </h3>
            <input
              type="text"
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVoiceConfirm();
                if (e.key === 'Escape') handleVoiceCancel();
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                marginBottom: 20,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handleVoiceCancel}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: '#f5f5f5',
                  color: '#666',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                取消（继续识别）
              </button>
              <button
                onClick={handleVoiceConfirm}
                style={{
                  padding: '8px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4CAF50',
                  color: 'white',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
