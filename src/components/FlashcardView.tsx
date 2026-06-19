import React, { useState } from 'react';
import type { Deck, Question } from '../types';
import { ArrowLeft, Star, RotateCw, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface FlashcardViewProps {
  deck: Deck;
  onSaveProgress: (deckId: string, correctIds: string[], wrongIds: string[], starredIds: string[]) => void;
  onBack: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ deck, onSaveProgress, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [starredIds, setStarredIds] = useState<string[]>(deck.progress.starredQuestions || []);
  
  // Track learning progress in the current session
  const [sessionCorrect, setSessionCorrect] = useState<string[]>([]);
  const [sessionWrong, setSessionWrong] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const questions = deck.questions;
  const currentQuestion: Question | undefined = questions[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleStar = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    let updated: string[];
    if (starredIds.includes(questionId)) {
      updated = starredIds.filter(id => id !== questionId);
    } else {
      updated = [...starredIds, questionId];
    }
    setStarredIds(updated);
    // Sync immediately
    onSaveProgress(
      deck.id,
      deck.progress.correctQuestions,
      deck.progress.wrongQuestions,
      updated
    );
  };

  const handleAnswer = (known: boolean) => {
    if (!currentQuestion) return;
    
    const questionId = currentQuestion.id;
    let nextCorrect = [...deck.progress.correctQuestions];
    let nextWrong = [...deck.progress.wrongQuestions];

    if (known) {
      // Add to session correct
      if (!sessionCorrect.includes(questionId)) setSessionCorrect([...sessionCorrect, questionId]);
      setSessionWrong(sessionWrong.filter(id => id !== questionId));

      // Add to general deck progress
      if (!nextCorrect.includes(questionId)) nextCorrect.push(questionId);
      nextWrong = nextWrong.filter(id => id !== questionId);
    } else {
      // Add to session wrong
      if (!sessionWrong.includes(questionId)) setSessionWrong([...sessionWrong, questionId]);
      setSessionCorrect(sessionCorrect.filter(id => id !== questionId));

      // Add to general deck progress
      if (!nextWrong.includes(questionId)) nextWrong.push(questionId);
      nextCorrect = nextCorrect.filter(id => id !== questionId);
    }

    // Save to parent state / localStorage
    onSaveProgress(deck.id, nextCorrect, nextWrong, starredIds);

    // Advance to next question
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
      }
    }, 150); // slight delay to allow flip animation to reset
  };

  const handleRestart = (onlyWrong = false) => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setSessionCorrect([]);
    setSessionWrong([]);
    
    if (onlyWrong) {
      // Filter is handled by parent, but here we can just reset within the current scope
      // For simplicity, if they want to review wrong cards, we do it in Review Mode.
      // Restarting in Flashcard mode restarts the entire deck.
    }
  };

  // If the deck has no questions
  if (questions.length === 0) {
    return (
      <div className="fade-in-up" style={styles.container}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="double-bezel">
          <div className="double-bezel-inner" style={{ textAlign: 'center', padding: 40 }}>
            <h3>Bộ đề này không có câu hỏi nào.</h3>
          </div>
        </div>
      </div>
    );
  }

  // End of deck layout
  if (isFinished) {
    const correctCount = sessionCorrect.length;
    const wrongCount = sessionWrong.length;
    const totalLearned = correctCount + wrongCount;
    const accuracy = totalLearned > 0 ? Math.round((correctCount / totalLearned) * 100) : 0;

    return (
      <div className="fade-in-up" style={styles.container}>
        <div className="double-bezel" style={styles.finishedCard}>
          <div className="double-bezel-inner" style={styles.finishedInner}>
            <div style={styles.successIcon}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h2>Hoàn Thành Học Flashcard!</h2>
            <p>Bạn đã hoàn thành việc xem qua tất cả {questions.length} thẻ ghi nhớ trong bộ đề **{deck.name}**.</p>

            <div style={styles.finishedStats}>
              <div style={styles.finishedStatBox}>
                <span style={{ ...styles.finishedStatValue, color: '#10b981' }}>{correctCount}</span>
                <span style={styles.finishedStatLabel}>Đã thuộc</span>
              </div>
              <div style={styles.finishedStatBox}>
                <span style={{ ...styles.finishedStatValue, color: '#ef4444' }}>{wrongCount}</span>
                <span style={styles.finishedStatLabel}>Chưa thuộc</span>
              </div>
              <div style={styles.finishedStatBox}>
                <span style={styles.finishedStatValue}>{accuracy}%</span>
                <span style={styles.finishedStatLabel}>Tỷ lệ nhớ</span>
              </div>
            </div>

            <div style={styles.finishedActions}>
              <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                Về bảng điều khiển
              </button>
              <button className="btn-primary" onClick={() => handleRestart()} style={{ flex: 1.5, justifyContent: 'center' }}>
                <RefreshCw size={14} />
                Học lại từ đầu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isStarred = starredIds.includes(currentQuestion.id);

  return (
    <div className="fade-in-up" style={styles.container}>
      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          Bảng điều khiển
        </button>
        <span style={styles.deckNameTitle}>{deck.name} • Flashcard</span>
        <span style={styles.counterText}>Thẻ {currentIndex + 1} / {questions.length}</span>
      </div>

      {/* Progress line */}
      <div style={styles.progressLineBg}>
        <div style={{ ...styles.progressLineFill, width: `${((currentIndex) / questions.length) * 100}%` }} />
      </div>

      {/* 3D Flashcard Container */}
      <div 
        className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`} 
        onClick={handleFlip}
        style={styles.cardContainer}
      >
        <div className="flashcard-inner">
          {/* FRONT */}
          <div className="flashcard-front">
            <div className="double-bezel" style={{ height: '100%' }}>
              <div className="double-bezel-inner" style={styles.cardInnerFront}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={styles.cardBadge}>CÂU HỎI</span>
                    {currentQuestion.isSolvedByAi && (
                      <span style={styles.aiBadge}>🤖 AI tự giải</span>
                    )}
                  </div>
                  <button 
                    style={{ ...styles.starBtn, color: isStarred ? '#f59e0b' : 'var(--text-muted)' }}
                    onClick={(e) => handleStar(e, currentQuestion.id)}
                    title={isStarred ? "Bỏ đánh dấu" : "Đánh dấu câu hỏi"}
                  >
                    <Star size={20} fill={isStarred ? '#f59e0b' : 'none'} />
                  </button>
                </div>
                
                <div style={styles.questionText}>
                  {currentQuestion.question}
                </div>

                <div style={styles.hintText}>
                  <RotateCw size={12} style={{ marginRight: 6 }} />
                  Chạm vào thẻ để lật xem đáp án
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className="flashcard-back">
            <div className="double-bezel" style={{ height: '100%' }}>
              <div className="double-bezel-inner" style={styles.cardInnerBack}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...styles.cardBadge, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>ĐÁP ÁN ĐÚNG</span>
                    {currentQuestion.isSolvedByAi && (
                      <span style={styles.aiBadge}>🤖 AI tự giải</span>
                    )}
                  </div>
                  <button 
                    style={{ ...styles.starBtn, color: isStarred ? '#f59e0b' : 'var(--text-muted)' }}
                    onClick={(e) => handleStar(e, currentQuestion.id)}
                  >
                    <Star size={20} fill={isStarred ? '#f59e0b' : 'none'} />
                  </button>
                </div>

                <div style={styles.answerText}>
                  Đáp án chính xác: <strong style={{ color: '#10b981', fontSize: 18 }}>{currentQuestion.correctAnswer}</strong>
                </div>

                <div style={styles.optionsList}>
                  {currentQuestion.options.map((opt, i) => {
                    const isCorrectOption = opt.trim().startsWith(currentQuestion.correctAnswer) || 
                                           opt.trim().startsWith(`${currentQuestion.correctAnswer}.`) ||
                                           opt.trim().startsWith(`${currentQuestion.correctAnswer})`);
                    return (
                      <div 
                        key={i} 
                        style={{
                          ...styles.optionRow,
                          background: isCorrectOption ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                          borderColor: isCorrectOption ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-muted)',
                        }}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {currentQuestion.explanation && (
                  <div style={styles.explanationBox}>
                    <strong style={{ color: '#a78bfa', fontSize: 12, display: 'block', marginBottom: 4 }}>GIẢI THÍCH:</strong>
                    <div style={styles.explanationContent}>
                      {currentQuestion.explanation}
                    </div>
                  </div>
                )}

                <div style={styles.hintText}>
                  Chạm để quay lại câu hỏi
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Button options */}
      <div style={styles.controls}>
        {!isFlipped ? (
          <button className="btn-primary" onClick={handleFlip} style={styles.flipBtn}>
            <RotateCw size={16} />
            Lật xem đáp án
          </button>
        ) : (
          <div style={styles.flipControls}>
            <button 
              className="btn-secondary" 
              style={{ ...styles.choiceBtn, borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
              onClick={() => handleAnswer(false)}
            >
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ color: '#fca5a5' }}>Chưa thuộc</span>
            </button>
            <button 
              className="btn-primary" 
              style={{ ...styles.choiceBtn, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              onClick={() => handleAnswer(true)}
            >
              <CheckCircle2 size={16} />
              <span>Đã thuộc</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '680px',
    margin: '0 auto',
    width: '100%',
    paddingBottom: 60,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    transition: 'var(--transition-fluid)',
  },
  deckNameTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ffffff',
  },
  counterText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  progressLineBg: {
    height: 4,
    background: '#18181b',
    borderRadius: 2,
    width: '100%',
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressLineFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  cardContainer: {
    marginBottom: 32,
  },
  cardInnerFront: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    minHeight: '340px',
    padding: '24px',
  },
  cardInnerBack: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    minHeight: '340px',
    padding: '24px',
    overflowY: 'auto',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: 800,
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  aiBadge: {
    fontSize: 9,
    fontWeight: 700,
    background: 'rgba(167, 139, 250, 0.1)',
    color: '#c084fc',
    border: '1px solid rgba(167, 139, 250, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.5,
    textAlign: 'center',
    margin: 'auto 0',
    color: '#ffffff',
  },
  answerText: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  optionRow: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-muted)',
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  explanationBox: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: 16,
    textAlign: 'left',
  },
  explanationContent: {
    fontSize: 12.5,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  hintText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 'auto',
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
  },
  flipBtn: {
    width: '100%',
    maxWidth: '240px',
    justifyContent: 'center',
    padding: '14px 28px',
  },
  flipControls: {
    display: 'flex',
    gap: 16,
    width: '100%',
    maxWidth: '480px',
  },
  choiceBtn: {
    flex: 1,
    padding: '14px 28px',
    justifyContent: 'center',
    fontSize: 14,
  },
  finishedCard: {
    maxWidth: '540px',
    margin: '40px auto 0',
  },
  finishedInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px 24px',
    gap: 16,
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  finishedStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    width: '100%',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    padding: '16px 8px',
    borderRadius: '16px',
    margin: '12px 0',
  },
  finishedStatBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  finishedStatValue: {
    fontSize: 22,
    fontWeight: 800,
    color: '#ffffff',
  },
  finishedStatLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  finishedActions: {
    display: 'flex',
    gap: 12,
    width: '100%',
    marginTop: 8,
  }
};
