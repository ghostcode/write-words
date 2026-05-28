import { useState, useRef } from 'react';
import { PRESETS } from '../utils/presets';
import ConfirmDialog from './ConfirmDialog';

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
  isVoiceListening: boolean;
  onToggleVoiceInput: () => void;
  onStopVoiceInput: () => void;
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
  isVoiceListening,
  onToggleVoiceInput,
  onStopVoiceInput,
}: WordInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [batchValue, setBatchValue] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
              <button className="btn-icon" title="语音输入" onClick={onToggleVoiceInput}>
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
              <button className="btn btn-small btn-danger" onClick={onStopVoiceInput}>停止</button>
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

      {/* 确认对话框 */}
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
    </div>
  );
}
