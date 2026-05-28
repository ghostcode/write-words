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
