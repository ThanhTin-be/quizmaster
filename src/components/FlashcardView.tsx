import React, { useState, useEffect } from 'react';
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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const questions = deck.questions;

  // Keyboard shortcuts event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || questions.length === 0) return;
      
      // Avoid intercepting when user is typing inside an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft') {
        handleAnswer(false);
      } else if (e.key === 'ArrowRight') {
        handleAnswer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, isFlipped, isFinished, questions, swipeDirection, starredIds]);

  // Helper to extract clean correct option description without prefix (A., B) etc.)
  const getCleanCorrectOptionText = () => {
    if (!currentQuestion) return '';
    const fullOption = currentQuestion.options.find(opt => {
      const trimmed = opt.trim();
      return trimmed.startsWith(currentQuestion.correctAnswer) && 
             (trimmed.startsWith(`${currentQuestion.correctAnswer}.`) || 
              trimmed.startsWith(`${currentQuestion.correctAnswer})`) || 
              trimmed.startsWith(`${currentQuestion.correctAnswer}:`) || 
              trimmed.startsWith(`${currentQuestion.correctAnswer}-`) || 
              trimmed.startsWith(`${currentQuestion.correctAnswer} `) ||
              trimmed === currentQuestion.correctAnswer);
    });
    
    if (!fullOption) return currentQuestion.correctAnswer;
    
    // Strip prefixes like "A.", "A)", "A:", "A -", "A " (case insensitive)
    const prefixRegex = new RegExp(`^${currentQuestion.correctAnswer}[.\\):\\-\\s]+`, 'i');
    const cleaned = fullOption.replace(prefixRegex, '').trim();
    return cleaned || fullOption;
  };
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
    if (!currentQuestion || swipeDirection) return;
    
    // Set swipe direction to trigger CSS animation
    setSwipeDirection(known ? 'right' : 'left');
    
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

    // Advance to next question after animation ends
    setTimeout(() => {
      setIsFlipped(false);
      setSwipeDirection(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
      }
    }, 500); // 500ms swipe animation
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

      {/* 3D Flashcard Stack Container */}
      <div className="stack-container">
        {/* Next Card in Stack (Visual Only) */}
        {currentIndex < questions.length - 1 && (
          <div 
            className={`flashcard-wrapper next-card ${swipeDirection ? 'scale-up' : ''}`}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="double-bezel" style={{ height: '100%' }}>
                  <div className="double-bezel-inner" style={styles.cardInnerFront}>
                    <div style={styles.cardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={styles.cardBadge}>CÂU HỎI</span>
                        {questions[currentIndex + 1].isSolvedByAi && (
                          <span style={styles.aiBadge}>🤖 AI tự giải</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={styles.questionText}>
                      {questions[currentIndex + 1].question}
                    </div>

                    <div style={styles.hintText}>
                      <RotateCw size={12} style={{ marginRight: 6 }} />
                      Chạm vào thẻ để lật xem đáp án
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Active Card */}
        <div 
          className={`flashcard-wrapper active-card ${isFlipped ? 'flipped' : ''} ${swipeDirection ? `swipe-${swipeDirection}` : ''}`} 
          onClick={handleFlip}
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

                  <div style={styles.answerTextContainer}>
                    <div style={styles.answerLabel}>ĐÁP ÁN ĐÚNG</div>
                    <div style={styles.largeAnswerText}>
                      {getCleanCorrectOptionText()}
                    </div>
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
      </div>

      {/* Button options */}
      <div style={styles.controlsContainer}>
        <div style={styles.controls}>
          <div style={styles.flipControls}>
            <button 
              className="btn-secondary" 
              style={{ 
                ...styles.choiceBtn, 
                borderColor: 'var(--error)', 
                background: 'rgba(239, 68, 68, 0.05)', 
                color: 'var(--error)' 
              }}
              onClick={() => handleAnswer(false)}
              disabled={!!swipeDirection}
            >
              <AlertTriangle size={16} color="var(--error)" />
              <span>Không biết</span>
            </button>
            <button 
              className="btn-primary" 
              style={{ 
                ...styles.choiceBtn, 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                borderColor: 'transparent',
                color: '#ffffff'
              }}
              onClick={() => handleAnswer(true)}
              disabled={!!swipeDirection}
            >
              <CheckCircle2 size={16} color="#ffffff" />
              <span>Đã biết</span>
            </button>
          </div>
        </div>

        {/* Keyboard shortcut hints on Desktop */}
        <div className="desktop-only-hints" style={styles.keyboardHints}>
          <span style={styles.keyHint}><kbd style={styles.kbd}>Space</kbd> Thẻ lật</span>
          <span style={styles.keyHint}><kbd style={styles.kbd}>←</kbd> Không biết</span>
          <span style={styles.keyHint}><kbd style={styles.kbd}>→</kbd> Biết</span>
        </div>
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
    color: 'var(--text-primary)',
  },
  counterText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  progressLineBg: {
    height: 4,
    background: 'var(--bg-surface-elevated)',
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
    color: 'var(--text-primary)',
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
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
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
  controlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
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
  keyboardHints: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 600,
  },
  kbd: {
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-muted)',
    borderRadius: '6px',
    padding: '3px 8px',
    marginRight: 6,
    fontSize: 10,
    fontWeight: 800,
    fontFamily: 'inherit',
    color: 'var(--text-secondary)',
    boxShadow: '0 2px 0 var(--border-muted)',
  },
  keyHint: {
    display: 'flex',
    alignItems: 'center',
  },
  answerTextContainer: {
    margin: 'auto 0',
    textAlign: 'center',
    padding: '24px 12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--text-muted)',
    letterSpacing: '0.15em',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  largeAnswerText: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--success)',
    lineHeight: 1.6,
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
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
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
    color: 'var(--text-primary)',
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
