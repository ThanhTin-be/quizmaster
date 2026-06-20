import React, { useState } from 'react';
import type { Deck, Question } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, Award, RefreshCw, Star } from 'lucide-react';

interface QuizViewProps {
  deck: Deck;
  onSaveProgress: (deckId: string, correctIds: string[], wrongIds: string[], starredIds: string[]) => void;
  onBack: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ deck, onSaveProgress, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [starredIds, setStarredIds] = useState<string[]>(deck.progress.starredQuestions || []);
  
  // Quiz score keeping
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = deck.questions;
  const currentQuestion: Question | undefined = questions[currentIndex];

  const handleOptionClick = (optionLabel: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(optionLabel);
    setIsAnswered(true);

    const questionId = currentQuestion.id;
    const isCorrect = optionLabel === currentQuestion.correctAnswer;

    let nextCorrect = [...deck.progress.correctQuestions];
    let nextWrong = [...deck.progress.wrongQuestions];

    if (isCorrect) {
      setScore(prev => prev + 1);
      
      // Update general deck progress
      if (!nextCorrect.includes(questionId)) nextCorrect.push(questionId);
      nextWrong = nextWrong.filter(id => id !== questionId);
    } else {
      // Update general deck progress
      if (!nextWrong.includes(questionId)) nextWrong.push(questionId);
      nextCorrect = nextCorrect.filter(id => id !== questionId);
    }

    // Sync to parent/localStorage
    onSaveProgress(deck.id, nextCorrect, nextWrong, starredIds);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleStar = (questionId: string) => {
    let updated: string[];
    if (starredIds.includes(questionId)) {
      updated = starredIds.filter(id => id !== questionId);
    } else {
      updated = [...starredIds, questionId];
    }
    setStarredIds(updated);
    onSaveProgress(
      deck.id,
      deck.progress.correctQuestions,
      deck.progress.wrongQuestions,
      updated
    );
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

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

  if (isFinished) {
    const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
      <div className="fade-in-up" style={styles.container}>
        <div className="double-bezel" style={styles.finishedCard}>
          <div className="double-bezel-inner" style={styles.finishedInner}>
            <div style={styles.successIcon}>
              <Award size={48} color="#a78bfa" />
            </div>
            <h2>Hoàn Thành Bài Thi Trắc Nghiệm!</h2>
            <p>Bộ đề **{deck.name}** đã được làm xong. Cùng xem lại kết quả của bạn nhé.</p>

            <div style={styles.finishedStats}>
              <div style={styles.finishedStatBox}>
                <span style={{ ...styles.finishedStatValue, color: '#10b981' }}>{score}</span>
                <span style={styles.finishedStatLabel}>Đúng</span>
              </div>
              <div style={styles.finishedStatBox}>
                <span style={{ ...styles.finishedStatValue, color: '#ef4444' }}>{questions.length - score}</span>
                <span style={styles.finishedStatLabel}>Sai</span>
              </div>
              <div style={styles.finishedStatBox}>
                <span style={styles.finishedStatValue}>{accuracy}%</span>
                <span style={styles.finishedStatLabel}>Độ chính xác</span>
              </div>
            </div>

            <div style={styles.finishedActions}>
              <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                Về bảng điều khiển
              </button>
              <button className="btn-primary" onClick={handleRestart} style={{ flex: 1.5, justifyContent: 'center' }}>
                <RefreshCw size={14} />
                Làm lại đề thi
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
        <span style={styles.deckNameTitle}>{deck.name} • Trắc nghiệm</span>
        <span style={styles.counterText}>Câu hỏi {currentIndex + 1} / {questions.length}</span>
      </div>

      {/* Progress Line */}
      <div style={styles.progressLineBg}>
        <div style={{ ...styles.progressLineFill, width: `${(currentIndex / questions.length) * 100}%` }} />
      </div>

      <div className="double-bezel" style={styles.card}>
        <div className="double-bezel-inner" style={styles.cardInner}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={styles.scoreBadge}>ĐIỂM SỐ: {score}/{currentIndex + (isAnswered ? 1 : 0)}</div>
              {currentQuestion.isSolvedByAi && (
                <div style={styles.aiBadge}>🤖 AI tự giải</div>
              )}
            </div>
            <button 
              style={{ ...styles.starBtn, color: isStarred ? '#f59e0b' : 'var(--text-muted)' }}
              onClick={() => handleStar(currentQuestion.id)}
              title={isStarred ? "Bỏ đánh dấu" : "Đánh dấu câu hỏi"}
            >
              <Star size={20} fill={isStarred ? '#f59e0b' : 'none'} />
            </button>
          </div>

          {/* Question Text */}
          <div style={styles.questionText}>
            {currentQuestion.question}
          </div>

          {/* Options Grid */}
          <div style={styles.optionsList}>
            {currentQuestion.options.map((option, i) => {
              // Extract label (A, B, C, D...) from option string
              // Usually the option starts with "A. " or "A) "
              const cleanOption = option.trim();
              const optionLabel = cleanOption.charAt(0); // A, B, C, D...

              const isSelected = selectedOption === optionLabel;
              const isCorrectAnswer = optionLabel === currentQuestion.correctAnswer;
              
              let btnStyle = { ...styles.optionButton };
              
              if (isAnswered) {
                if (isCorrectAnswer) {
                  // highlight green
                  btnStyle = {
                    ...btnStyle,
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--text-primary)',
                  };
                } else if (isSelected) {
                  // highlight red
                  btnStyle = {
                    ...btnStyle,
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: 'var(--text-primary)',
                  };
                } else {
                  // muted
                  btnStyle = {
                    ...btnStyle,
                    opacity: 0.5,
                  };
                }
              }

              return (
                <button
                  key={i}
                  style={btnStyle}
                  onClick={() => handleOptionClick(optionLabel)}
                  disabled={isAnswered}
                  className={!isAnswered ? "btn-option-hover" : ""}
                >
                  <div style={styles.optionContent}>
                    <div 
                      style={{
                        ...styles.optionIndicator,
                        borderColor: isAnswered && isCorrectAnswer 
                          ? '#10b981' 
                          : isAnswered && isSelected 
                            ? '#ef4444' 
                            : 'var(--border-muted)',
                        background: isAnswered && isCorrectAnswer
                          ? '#10b981'
                          : isAnswered && isSelected
                            ? '#ef4444'
                            : 'transparent'
                      }}
                    >
                      {isAnswered && isCorrectAnswer && <CheckCircle2 size={12} color="#ffffff" />}
                      {isAnswered && isSelected && !isCorrectAnswer && <XCircle size={12} color="#ffffff" />}
                      {(!isAnswered || (!isSelected && !isCorrectAnswer)) && <span style={{ fontSize: 10, fontWeight: 700 }}>{optionLabel}</span>}
                    </div>
                    <span style={{ textAlign: 'left' }}>{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswered && (
            <div style={styles.feedbackSection} className="fade-in-up">
              <div 
                style={{ 
                  ...styles.statusMessage, 
                  color: selectedOption === currentQuestion.correctAnswer ? '#10b981' : '#ef4444',
                  background: selectedOption === currentQuestion.correctAnswer ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                  borderColor: selectedOption === currentQuestion.correctAnswer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                }}
              >
                {selectedOption === currentQuestion.correctAnswer ? (
                  <>
                    <CheckCircle2 size={16} color="#10b981" />
                    <strong>Chính xác! Đáp án đúng là {currentQuestion.correctAnswer}.</strong>
                  </>
                ) : (
                  <>
                    <XCircle size={16} color="#ef4444" />
                    <strong>Chưa đúng! Đáp án đúng là {currentQuestion.correctAnswer}.</strong>
                  </>
                )}
              </div>

              {currentQuestion.explanation && (
                <div style={styles.explanationBox}>
                  <div style={styles.explanationTitle}>GIẢI THÍCH:</div>
                  <div style={styles.explanationTextContent}>{currentQuestion.explanation}</div>
                </div>
              )}

              <button className="btn-primary" onClick={handleNext} style={styles.nextBtn}>
                Câu tiếp theo
                <div className="btn-icon-circle">
                  <span>→</span>
                </div>
              </button>
            </div>
          )}
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
  card: {
    width: '100%',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreBadge: {
    fontSize: 11,
    fontWeight: 800,
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    padding: '4px 10px',
    borderRadius: '6px',
    letterSpacing: '0.05em',
  },
  aiBadge: {
    fontSize: 9,
    fontWeight: 700,
    background: 'rgba(167, 139, 250, 0.1)',
    color: '#c084fc',
    border: '1px solid rgba(167, 139, 250, 0.15)',
    padding: '3px 8px',
    borderRadius: '6px',
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
    color: 'var(--text-primary)',
    marginBottom: 24,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    width: '100%',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid var(--border-muted)',
    background: 'var(--bg-surface-elevated)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    outline: 'none',
  },
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    lineHeight: 1.4,
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '1px solid var(--border-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  feedbackSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    borderTop: '1px solid var(--border-muted)',
    paddingTop: 24,
  },
  statusMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: 14,
  },
  explanationBox: {
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'left',
  },
  explanationTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: '#a78bfa',
    letterSpacing: '0.05em',
    marginBottom: 6,
  },
  explanationTextContent: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  nextBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '14px',
    marginTop: 8,
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
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
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
