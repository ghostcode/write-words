/**
 * 本地存储模块
 * 封装 localStorage 操作
 */

const PREFIX = 'dictation_';

function getKey(key: string): string {
  return PREFIX + key;
}

function isAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function set<T>(key: string, value: T): boolean {
  if (!isAvailable()) return false;
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function get<T>(key: string, defaultValue: T): T {
  if (!isAvailable()) return defaultValue;
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw !== null ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// 设置
export interface AppSettings {
  interval: number;
  showWord: boolean;
  selectedVoice: string | null;
}

export function getSettings(): AppSettings {
  return get<AppSettings>('settings', {
    interval: 8,
    showWord: true,
    selectedVoice: null,
  });
}

export function saveSettings(settings: AppSettings): boolean {
  return set('settings', settings);
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): boolean {
  const settings = getSettings();
  settings[key] = value;
  return saveSettings(settings);
}

// 词库
export interface WordListData {
  words: string[];
  createdAt: number;
  updatedAt: number;
}

export function getWordLists(): Record<string, WordListData> {
  return get<Record<string, WordListData>>('wordlists', {});
}

export function saveWordList(name: string, words: string[]): boolean {
  const lists = getWordLists();
  const existing = lists[name];
  lists[name] = {
    words,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  return set('wordlists', lists);
}

// 历史记录
export interface RecordData {
  id: number;
  total: number;
  correct: number;
  wrong: number;
  rate: number;
  duration: number;
  words: string[];
  timestamp: number;
}

export function getRecords(): RecordData[] {
  return get<RecordData[]>('records', []);
}

export function saveRecord(record: Omit<RecordData, 'id' | 'timestamp'>): boolean {
  const records = getRecords();
  records.unshift({ ...record, id: Date.now(), timestamp: Date.now() });
  if (records.length > 50) records.length = 50;
  return set('records', records);
}

// 上次使用的词语
export function getLastWords(): string[] {
  return get<string[]>('lastWords', []);
}

export function saveLastWords(words: string[]): boolean {
  return set('lastWords', words);
}

export { isAvailable };
