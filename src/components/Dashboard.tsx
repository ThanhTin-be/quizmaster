import React from 'react';
import type { Deck } from '../types';
import { BookOpen, GraduationCap, RefreshCw, Trash2, Zap } from 'lucide-react';

interface DashboardProps {
  decks: Deck[];
  onSelectDeck: (deckId: string, mode: 'flashcard' | 'quiz' | 'review') => void;
  onDeleteDeck: (deckId: string) => void;
  onGoImport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  decks,
  onSelectDeck,
  onDeleteDeck,
  onGoImport,
}) => {
  return (
    <div className="fade-in-up" style={styles.container}>
      <div style={styles.heroSection}>
        <div style={styles.eyebrow}>HỌC THÔNG MINH - NHỚ BỀN VỮNG</div>
        <h1>Làm Chủ Mọi Đề Thi Với QuizMaster</h1>
        <p style={styles.heroDesc}>
          Chuyển đổi bài giảng, tài liệu PDF thành Flashcard và bộ câu hỏi trắc nghiệm tự động nhờ sức mạnh AI. Ôn luyện tập trung và tối ưu trí nhớ.
        </p>
      </div>

      {decks.length === 0 ? (
        <div className="double-bezel" style={styles.emptyContainer}>
          <div className="double-bezel-inner" style={styles.emptyInner}>
            <div style={styles.emptyIcon}>
              <GraduationCap size={48} color="#a78bfa" />
            </div>
            <h3>Chưa có bộ đề học tập nào</h3>
            <p style={styles.emptyText}>
              Bắt đầu bằng cách tải tài liệu PDF của bạn lên AI, chuyển đổi thành JSON và dán vào QuizMaster để tạo bộ câu hỏi đầu tiên.
            </p>
            <button className="btn-primary" onClick={onGoImport} style={{ marginTop: 12 }}>
              Tạo bộ đề ngay
              <div className="btn-icon-circle">
                <span>↗</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {decks.map((deck) => {
            const totalQuestions = deck.questions.length;
            const correctCount = deck.progress.correctQuestions.length;
            const wrongCount = deck.progress.wrongQuestions.length;
            const completionRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
            
            return (
              <div key={deck.id} className="double-bezel" style={styles.deckCard}>
                <div className="double-bezel-inner" style={styles.deckInner}>
                  <div style={styles.deckHeader}>
                    <div style={styles.deckTitleContainer}>
                      <div style={styles.deckIcon}>
                        <BookOpen size={18} color="#a78bfa" />
                      </div>
                      <h3 style={styles.deckTitle}>{deck.name}</h3>
                    </div>
                    <button 
                      style={styles.deleteBtn}
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa bộ đề "${deck.name}"?`)) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                      title="Xóa bộ đề"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  <div style={styles.progressContainer}>
                    <div style={styles.progressHeader}>
                      <span style={styles.progressLabel}>Tiến độ ôn tập</span>
                      <span style={styles.progressPercentage}>{completionRate}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <div 
                        style={{ 
                          ...styles.progressBarFill, 
                          width: `${completionRate}%`,
                          background: completionRate === 100 
                            ? 'linear-gradient(90deg, #10b981, #34d399)' 
                            : 'linear-gradient(90deg, #8b5cf6, #6366f1)'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Stats list */}
                  <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                      <span style={styles.statValue}>{totalQuestions}</span>
                      <span style={styles.statLabel}>Tổng câu</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={{ ...styles.statValue, color: '#10b981' }}>{correctCount}</span>
                      <span style={styles.statLabel}>Đã thuộc</span>
                    </div>
                    <div style={styles.statBox}>
                      <span style={{ ...styles.statValue, color: wrongCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>{wrongCount}</span>
                      <span style={styles.statLabel}>Cần ôn</span>
                    </div>
                  </div>

                  {/* Action actions */}
                  <div style={styles.actions}>
                    <button 
                      className="btn-secondary" 
                      style={styles.actionBtn}
                      onClick={() => onSelectDeck(deck.id, 'flashcard')}
                    >
                      <Zap size={14} color="#a78bfa" />
                      Flashcard
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ ...styles.actionBtn, flex: 1 }}
                      onClick={() => onSelectDeck(deck.id, 'quiz')}
                    >
                      <GraduationCap size={14} />
                      Trắc nghiệm
                    </button>
                  </div>

                  {/* Review errors block */}
                  <button
                    className="btn-secondary"
                    style={{ 
                      ...styles.reviewBtn,
                      opacity: wrongCount > 0 ? 1 : 0.5,
                      cursor: wrongCount > 0 ? 'pointer' : 'not-allowed',
                      borderColor: wrongCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-muted)'
                    }}
                    onClick={() => {
                      if (wrongCount > 0) {
                        onSelectDeck(deck.id, 'review');
                      }
                    }}
                    disabled={wrongCount === 0}
                  >
                    <RefreshCw size={14} color={wrongCount > 0 ? '#ef4444' : 'var(--text-muted)'} />
                    <span style={{ color: wrongCount > 0 ? '#fca5a5' : 'var(--text-muted)' }}>
                      Ôn {wrongCount} câu làm sai
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
    marginBottom: 48,
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
    fontSize: 16,
    marginTop: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 24,
  },
  emptyContainer: {
    maxWidth: '580px',
    margin: '0 auto',
  },
  emptyInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px 24px',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 1.5,
  },
  deckCard: {
    height: '100%',
  },
  deckInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  deckHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  deckIcon: {
    width: 32,
    height: 32,
    borderRadius: '8px',
    background: 'rgba(139, 92, 246, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 6,
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fluid)',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  progressLabel: {
    color: 'var(--text-secondary)',
  },
  progressPercentage: {
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  progressBarBg: {
    height: 6,
    background: 'var(--bg-surface-elevated)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
    padding: '12px 6px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    padding: '10px 16px',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewBtn: {
    width: '100%',
    padding: '10px',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'rgba(239, 68, 68, 0.03)',
  }
};
