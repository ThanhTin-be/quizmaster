import React, { useState, useEffect } from 'react';
import type { Deck, MockTestConfig, MockTestHistoryItem } from '../types';
import { Calendar, Clock, GraduationCap, Play, Trash2, Eye, HelpCircle, AlertCircle } from 'lucide-react';

interface MockTestDashboardProps {
  decks: Deck[];
  onStartTest: (config: MockTestConfig) => void;
  history: MockTestHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onViewHistoryItem: (item: MockTestHistoryItem) => void;
}

export const MockTestDashboard: React.FC<MockTestDashboardProps> = ({
  decks,
  onStartTest,
  history,
  onDeleteHistoryItem,
  onViewHistoryItem,
}) => {
  // Form states
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [selectionMode, setSelectionMode] = useState<'random' | 'sequential'>('random');
  const [sourceMode, setSourceMode] = useState<'single' | 'mix'>('single');
  
  const [deckAId, setDeckAId] = useState('');
  const [deckBId, setDeckBId] = useState('');
  
  const [deckAQuestionCount, setDeckAQuestionCount] = useState(10);
  const [deckBQuestionCount, setDeckBQuestionCount] = useState(10);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize values when decks load
  useEffect(() => {
    if (decks.length > 0) {
      setDeckAId(decks[0].id);
      
      const defaultAQuestions = Math.min(10, decks[0].questions.length);
      setDeckAQuestionCount(defaultAQuestions);
      
      if (decks.length > 1) {
        setDeckBId(decks[1].id);
        const defaultBQuestions = Math.min(10, decks[1].questions.length);
        setDeckBQuestionCount(defaultBQuestions);
      }
    }
    
    // Auto-generate title
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTitle(`Đề thi thử ${dateStr} lúc ${timeStr}`);
  }, [decks]);

  // Adjust question counts when selections change
  const handleDeckAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setDeckAId(id);
    const targetDeck = decks.find(d => d.id === id);
    if (targetDeck) {
      setDeckAQuestionCount(Math.min(15, targetDeck.questions.length));
    }
  };

  const handleDeckBChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setDeckBId(id);
    const targetDeck = decks.find(d => d.id === id);
    if (targetDeck) {
      setDeckBQuestionCount(Math.min(15, targetDeck.questions.length));
    }
  };

  const deckA = decks.find(d => d.id === deckAId);
  const deckB = decks.find(d => d.id === deckBId);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (decks.length === 0) {
      setErrorMsg('Vui lòng tạo bài học trước khi thi thử!');
      return;
    }

    if (!deckAId) {
      setErrorMsg('Vui lòng chọn ít nhất một bài học!');
      return;
    }

    if (sourceMode === 'mix') {
      if (!deckBId) {
        setErrorMsg('Vui lòng chọn bài học thứ hai để trộn!');
        return;
      }
      if (deckAId === deckBId) {
        setErrorMsg('Bài học thứ nhất và thứ hai không được trùng nhau khi trộn!');
        return;
      }
      
      const countA = Number(deckAQuestionCount);
      const countB = Number(deckBQuestionCount);
      
      if (isNaN(countA) || countA <= 0 || (deckA && countA > deckA.questions.length)) {
        setErrorMsg(`Số lượng câu của Bài học A phải từ 1 đến ${deckA?.questions.length || 0}`);
        return;
      }
      if (isNaN(countB) || countB <= 0 || (deckB && countB > deckB.questions.length)) {
        setErrorMsg(`Số lượng câu của Bài học B phải từ 1 đến ${deckB?.questions.length || 0}`);
        return;
      }
    } else {
      const countA = Number(deckAQuestionCount);
      if (isNaN(countA) || countA <= 0 || (deckA && countA > deckA.questions.length)) {
        setErrorMsg(`Số lượng câu của Bài học phải từ 1 đến ${deckA?.questions.length || 0}`);
        return;
      }
    }

    onStartTest({
      title: title.trim() || 'Đề thi thử tự do',
      durationMinutes,
      selectionMode,
      deckAId,
      deckBId: sourceMode === 'mix' ? deckBId : undefined,
      deckAQuestionCount: Number(deckAQuestionCount),
      deckBQuestionCount: sourceMode === 'mix' ? Number(deckBQuestionCount) : 0,
    });
  };

  const formatTimeSpent = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fade-in-up" style={styles.container}>
      <div style={styles.heroSection}>
        <div style={styles.eyebrow}>LUYỆN TẬP PHÒNG THI</div>
        <h1>Đề Thi Mẫu & Đánh Giá Năng Lực</h1>
        <p style={styles.heroDesc}>
          Tạo bộ đề thi thử với thời gian đếm ngược, kiểm soát câu hỏi từ một hoặc nhiều bài học. Đo lường tiến độ của bạn.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Form configuration - 3D double bezel */}
        <div className="double-bezel" style={styles.formCard}>
          <div className="double-bezel-inner" style={styles.cardInner}>
            <div style={styles.cardHeader}>
              <GraduationCap size={20} color="#a78bfa" />
              <h2 style={styles.cardTitle}>Thiết lập Đề thi thử</h2>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Exam Title */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Tên đề thi</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  placeholder="Nhập tên đề thi thử..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Selection Mode */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Chế độ chọn câu hỏi</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="selectionMode"
                      checked={selectionMode === 'random'}
                      onChange={() => setSelectionMode('random')}
                      style={styles.radioInput}
                    />
                    <div>
                      <div style={styles.radioTitle}>Ngẫu nhiên (Random)</div>
                      <div style={styles.radioDesc}>Xáo ngẫu nhiên câu hỏi trong kho bài học</div>
                    </div>
                  </label>
                  <label style={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="selectionMode"
                      checked={selectionMode === 'sequential'}
                      onChange={() => setSelectionMode('sequential')}
                      style={styles.radioInput}
                    />
                    <div>
                      <div style={styles.radioTitle}>Tuần tự (Sequential)</div>
                      <div style={styles.radioDesc}>Lấy từ câu đầu tiên (1, 2, 3...) - tránh bỏ sót</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Time limit */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Thời gian làm bài</label>
                <select 
                  style={styles.select}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  <option value={5}>5 phút (Kiểm tra nhanh)</option>
                  <option value={10}>10 phút</option>
                  <option value={15}>15 phút</option>
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                  <option value={0}>Không giới hạn thời gian</option>
                </select>
              </div>

              {/* Question source mode */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Nguồn câu hỏi</label>
                <div style={styles.tabHeader}>
                  <button
                    type="button"
                    style={{
                      ...styles.tabBtn,
                      background: sourceMode === 'single' ? 'var(--bg-surface-elevated)' : 'transparent',
                      borderColor: sourceMode === 'single' ? 'var(--border-active)' : 'transparent',
                      color: sourceMode === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                    onClick={() => setSourceMode('single')}
                  >
                    1 Bài học
                  </button>
                  <button
                    type="button"
                    disabled={decks.length < 2}
                    style={{
                      ...styles.tabBtn,
                      background: sourceMode === 'mix' ? 'var(--bg-surface-elevated)' : 'transparent',
                      borderColor: sourceMode === 'mix' ? 'var(--border-active)' : 'transparent',
                      color: sourceMode === 'mix' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      opacity: decks.length < 2 ? 0.5 : 1,
                      cursor: decks.length < 2 ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => setSourceMode('mix')}
                    title={decks.length < 2 ? 'Cần ít nhất 2 bài học để trộn' : ''}
                  >
                    Trộn 2 bài học
                  </button>
                </div>
                {decks.length < 2 && (
                  <div style={styles.infoAlert}>
                    <HelpCircle size={12} style={{ marginRight: 4 }} />
                    <span>Tải thêm học phần để mở khóa trộn bài học</span>
                  </div>
                )}
              </div>

              {/* Deck lists configurations */}
              {decks.length === 0 ? (
                <div style={styles.noDecksAlert}>
                  <AlertCircle size={16} />
                  <span>Không tìm thấy bài học nào. Vui lòng quay lại Thêm bài học.</span>
                </div>
              ) : sourceMode === 'single' ? (
                <div style={styles.sourcePanel}>
                  <div style={styles.formGroup}>
                    <label style={styles.subLabel}>Chọn bài học</label>
                    <select 
                      style={styles.select}
                      value={deckAId}
                      onChange={handleDeckAChange}
                    >
                      {decks.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.questions.length} câu)</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <div style={styles.labelRow}>
                      <label style={styles.subLabel}>Số lượng câu hỏi</label>
                      <span style={styles.sliderValue}>{deckAQuestionCount} câu</span>
                    </div>
                    {deckA && (
                      <input 
                        type="range"
                        min={1}
                        max={deckA.questions.length}
                        value={deckAQuestionCount}
                        onChange={(e) => setDeckAQuestionCount(Number(e.target.value))}
                        style={styles.slider}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div style={styles.sourcePanel}>
                  {/* Deck A */}
                  <div style={styles.mixGroup}>
                    <div style={{ ...styles.formGroup, flex: 1.5 }}>
                      <label style={styles.subLabel}>Bài học thứ nhất</label>
                      <select 
                        style={styles.select}
                        value={deckAId}
                        onChange={handleDeckAChange}
                      >
                        {decks.map(d => (
                          <option key={d.id} value={d.id} disabled={d.id === deckBId}>{d.name} ({d.questions.length} câu)</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.subLabel}>Số câu</label>
                      <input 
                        type="number"
                        min={1}
                        max={deckA ? deckA.questions.length : 1}
                        value={deckAQuestionCount}
                        onChange={(e) => setDeckAQuestionCount(Math.max(1, Number(e.target.value)))}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Deck B */}
                  <div style={styles.mixGroup}>
                    <div style={{ ...styles.formGroup, flex: 1.5 }}>
                      <label style={styles.subLabel}>Bài học thứ hai</label>
                      <select 
                        style={styles.select}
                        value={deckBId}
                        onChange={handleDeckBChange}
                      >
                        {decks.map(d => (
                          <option key={d.id} value={d.id} disabled={d.id === deckAId}>{d.name} ({d.questions.length} câu)</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.subLabel}>Số câu</label>
                      <input 
                        type="number"
                        min={1}
                        max={deckB ? deckB.questions.length : 1}
                        value={deckBQuestionCount}
                        onChange={(e) => setDeckBQuestionCount(Math.max(1, Number(e.target.value)))}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={styles.errorText}>
                  <AlertCircle size={14} style={{ marginRight: 6 }} />
                  {errorMsg}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={styles.submitBtn}
                disabled={decks.length === 0}
              >
                <Play size={16} fill="white" />
                Bắt đầu làm bài thi
                <div className="btn-icon-circle">
                  <span>→</span>
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* History Area */}
        <div style={styles.historySection}>
          <div style={styles.historyHeader}>
            <h2 style={styles.historyTitle}>Lịch sử thi thử ({history.length})</h2>
          </div>

          {history.length === 0 ? (
            <div className="double-bezel" style={{ height: 'max-content' }}>
              <div className="double-bezel-inner" style={styles.emptyHistoryInner}>
                <Calendar size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <h3>Chưa có kết quả thi thử</h3>
                <p style={styles.emptyHistoryText}>
                  Sau khi hoàn thành đề thi thử, kết quả đánh giá năng lực của bạn sẽ hiển thị tại đây để theo dõi sự tiến bộ.
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.historyList}>
              {history.map((item) => {
                const total = item.questions.length;
                const score = item.correctAnswers;
                const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
                
                // Color depending on accuracy
                let colorClass = '#ef4444'; // Red
                let bgLight = 'rgba(239, 68, 68, 0.05)';
                if (accuracy >= 80) {
                  colorClass = '#10b981'; // Green
                  bgLight = 'rgba(16, 185, 129, 0.05)';
                } else if (accuracy >= 50) {
                  colorClass = '#f59e0b'; // Orange/Yellow
                  bgLight = 'rgba(245, 158, 11, 0.05)';
                }

                return (
                  <div key={item.id} className="double-bezel" style={styles.historyCard}>
                    <div className="double-bezel-inner" style={styles.historyCardInner}>
                      <div style={styles.historyInfo}>
                        <div style={styles.historyTitleRow}>
                          <h4 style={styles.itemTitle}>{item.title}</h4>
                          <span style={{ 
                            ...styles.modeBadge,
                            background: bgLight,
                            color: colorClass,
                            borderColor: colorClass + '30',
                          }}>
                            {item.correctAnswers}/{item.totalQuestions} ({accuracy}%)
                          </span>
                        </div>
                        
                        <div style={styles.historyMetaRow}>
                          <span style={styles.metaItem}>
                            <Calendar size={12} style={{ marginRight: 4 }} />
                            {formatDate(item.date)}
                          </span>
                          <span style={styles.metaItem}>
                            <Clock size={12} style={{ marginRight: 4 }} />
                            Làm trong: {formatTimeSpent(item.timeSpentSeconds)}
                          </span>
                          <span style={{ ...styles.metaItem, textTransform: 'capitalize' }}>
                            🧬 {item.durationMinutes > 0 ? `${item.durationMinutes} phút` : 'Tự do'} • {item.userAnswers ? Object.keys(item.userAnswers).length : 0} câu đã làm
                          </span>
                        </div>
                      </div>

                      <div style={styles.historyActions}>
                        <button 
                          className="btn-secondary" 
                          style={styles.actionBtn}
                          onClick={() => onViewHistoryItem(item)}
                          title="Xem lại bài làm chi tiết"
                        >
                          <Eye size={14} />
                          Xem chi tiết
                        </button>
                        <button 
                          style={styles.deleteBtn}
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa lịch sử đề thi này?')) {
                              onDeleteHistoryItem(item.id);
                            }
                          }}
                          title="Xóa kết quả"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    paddingBottom: 60,
  },
  heroSection: {
    textAlign: 'center',
    marginBottom: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  eyebrow: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '9999px',
    padding: '4px 12px',
    fontSize: 10,
    fontWeight: 700,
    color: '#a78bfa',
    letterSpacing: '0.15em',
    marginBottom: 16,
    width: 'max-content',
  },
  heroDesc: {
    maxWidth: '640px',
    fontSize: 15,
    marginTop: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: 32,
    alignItems: 'start',
  },
  formCard: {
    height: 'auto',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid var(--border-muted)',
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border-muted)',
    background: 'var(--bg-surface-elevated)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'var(--transition-fluid)',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border-muted)',
    background: 'var(--bg-surface-elevated)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%2394a3b8' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  radioLabel: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-muted)',
    background: 'var(--bg-surface-elevated)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  radioInput: {
    marginTop: 4,
    accentColor: 'var(--accent)',
    width: 16,
    height: 16,
  },
  radioTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  radioDesc: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  tabHeader: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-muted)',
    padding: 4,
    borderRadius: '10px',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    padding: '10px',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
  },
  infoAlert: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  noDecksAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    background: 'rgba(239, 68, 68, 0.03)',
    color: '#fca5a5',
    fontSize: 13,
  },
  sourcePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid var(--border-muted)',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#a78bfa',
  },
  slider: {
    width: '100%',
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  mixGroup: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
  },
  submitBtn: {
    justifyContent: 'center',
    padding: '14px',
    marginTop: 8,
  },
  errorText: {
    display: 'flex',
    alignItems: 'center',
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 500,
  },
  historySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  emptyHistoryInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '48px 24px',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 8,
    lineHeight: 1.5,
    maxWidth: '380px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxHeight: '650px',
    overflowY: 'auto',
    paddingRight: 6,
  },
  historyCard: {
    width: '100%',
  },
  historyCardInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
  },
  historyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  historyTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  modeBadge: {
    fontSize: 11,
    fontWeight: 700,
    border: '1px solid transparent',
    padding: '2px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  historyMetaRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  historyActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: '8px 12px',
    fontSize: 12,
    gap: 4,
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid var(--border-muted)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 200ms ease',
  }
};
