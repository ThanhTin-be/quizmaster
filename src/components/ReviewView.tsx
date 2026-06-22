import React, { useState, useMemo } from 'react';
import type { Deck, Question } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Sparkles, Smile, Shuffle } from 'lucide-react';
import { buildShuffleMap } from '../utils/shuffleOptions';

interface ReviewViewProps {
  deck: Deck;
  onSaveProgress: (deckId: string, correctIds: string[], wrongIds: string[], starredIds: string[]) => void;
  onBack: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ deck, onSaveProgress, onBack }) => {
  const wrongIds = deck.progress.wrongQuestions || [];
  
  // Filter questions that are in the wrong questions list
  const wrongQuestions = deck.questions.filter(q => wrongIds.includes(q.id));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Shuffle key: tăng lên mỗi lần restart để tạo shuffle mới
  const [shuffleKey, setShuffleKey] = useState(0);

  // Tính trước shuffle cho toàn bộ câu hỏi sai (1 lần mỗi session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffleMaps = useMemo(() => buildShuffleMap(wrongQuestions), [wrongQuestions, shuffleKey]);

  const currentQuestion: Question | undefined = wrongQuestions[currentIndex];

  const handleOptionClick = (optionLabel: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(optionLabel);
    setIsAnswered(true);

    const questionId = currentQuestion.id;
    // So sánh với correctDisplayLabel sau khi shuffle
    const currentShuffle = shuffleMaps[currentIndex];
    const isCorrect = optionLabel === currentShuffle.correctDisplayLabel;

    let nextCorrect = [...deck.progress.correctQuestions];
    let nextWrong = [...deck.progress.wrongQuestions];

    if (isCorrect) {
      setSessionCorrectCount(prev => prev + 1);
      
      // Move from wrong to correct list
      nextWrong = nextWrong.filter(id => id !== questionId);
      if (!nextCorrect.includes(questionId)) nextCorrect.push(questionId);
    } else {
      // Stays in wrong, and make sure it's removed from correct
      nextCorrect = nextCorrect.filter(id => id !== questionId);
      if (!nextWrong.includes(questionId)) nextWrong.push(questionId);
    }

    // Sync state
    onSaveProgress(deck.id, nextCorrect, nextWrong, deck.progress.starredQuestions);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    // Note: Since answering correctly removes it from wrongQuestions,
    // the wrongQuestions list size will shrink next time we enter this screen,
    // but in this active session we keep the current index flow.
    // If the answer was correct, the NEXT question is now at the same index
    // because the current one is removed from the array!
    // Wait, let's look at how we navigate. If we just increment the index, and a question was removed,
    // we might skip one.
    // To solve this, let's keep the active session queue fixed!
    // We freeze the queue for the session so index navigation works perfectly,
    // and sync the actual deck progress under the hood.
    if (currentIndex < wrongQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
    setSessionCorrectCount(0);
    // Tăng shuffleKey để tạo shuffle mới cho session mới
    setShuffleKey(prev => prev + 1);
  };

  // If there are no wrong questions left
  if (wrongQuestions.length === 0 || isFinished) {
    return (
      <div className="fade-in-up" style={styles.container}>
        <div className="double-bezel" style={styles.finishedCard}>
          <div className="double-bezel-inner" style={styles.finishedInner}>
            <div style={styles.successIcon}>
              <Sparkles size={48} color="#10b981" />
            </div>
            <h2>Tuyệt Vời! Đã Sửa Hết Lỗi Sai</h2>
            {wrongQuestions.length === 0 ? (
              <p>Bạn đã trả lời đúng toàn bộ các câu hỏi từng làm sai trong bộ đề **{deck.name}**. Hãy tiếp tục phát huy!</p>
            ) : (
              <p>Bạn đã hoàn thành vòng ôn tập này. Trả lời đúng **{sessionCorrectCount}/{wrongQuestions.length}** câu hỏi.</p>
            )}

            <div style={styles.finishedActions}>
              <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                Về bảng điều khiển
              </button>
              {wrongQuestions.length > 0 && (
                <button className="btn-primary" onClick={handleRestart} style={{ flex: 1.5, justifyContent: 'center' }}>
                  <RefreshCw size={14} />
                  Ôn tập tiếp ({wrongQuestions.length} câu)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={styles.container}>
      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          Bảng điều khiển
        </button>
        <span style={styles.deckNameTitle}>{deck.name} • Ôn câu sai</span>
        <span style={styles.counterText}>Câu {currentIndex + 1} / {wrongQuestions.length}</span>
      </div>

      {/* Progress Line */}
      <div style={styles.progressLineBg}>
        <div style={{ ...styles.progressLineFill, width: `${(currentIndex / wrongQuestions.length) * 100}%` }} />
      </div>

      <div className="double-bezel" style={styles.card}>
        <div className="double-bezel-inner" style={styles.cardInner}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={styles.errorBadge}>CHẾ ĐỘ SỬA SAI: CÒN {wrongQuestions.length - currentIndex} CÂU</div>
              <div style={styles.shuffleBadge}><Shuffle size={10} style={{ marginRight: 4 }} />Đáp án ngẫu nhiên</div>
              {currentQuestion.isSolvedByAi && (
                <div style={styles.aiBadge}>🤖 AI tự giải</div>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div style={styles.questionText}>
            {currentQuestion.question}
          </div>

          {/* Options List - dùng shuffledOptions */}
          <div style={styles.optionsList}>
            {shuffleMaps[currentIndex]?.shuffledOptions.map((option, i) => {
              const cleanOption = option.trim();
              const optionLabel = cleanOption.charAt(0);
              const currentShuffle = shuffleMaps[currentIndex];

              const isSelected = selectedOption === optionLabel;
              const isCorrectAnswer = optionLabel === currentShuffle.correctDisplayLabel;
              
              let btnStyle = { ...styles.optionButton };
              
              if (isAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = {
                    ...btnStyle,
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--text-primary)',
                  };
                } else if (isSelected) {
                  btnStyle = {
                    ...btnStyle,
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: 'var(--text-primary)',
                  };
                } else {
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
                {selectedOption === shuffleMaps[currentIndex]?.correctDisplayLabel ? (
                  <>
                    <Smile size={16} color="#10b981" />
                    <strong>Tuyệt vời! Bạn đã sửa được câu hỏi này. (Sẽ loại khỏi mục làm sai)</strong>
                  </>
                ) : (
                  <>
                    <XCircle size={16} color="#ef4444" />
                    <strong>Vẫn chưa đúng. Câu này sẽ được giữ lại để ôn tiếp.</strong>
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
    background: 'linear-gradient(90deg, #ef4444, #f43f5e)',
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
  errorBadge: {
    fontSize: 11,
    fontWeight: 800,
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    padding: '4px 10px',
    borderRadius: '6px',
    letterSpacing: '0.05em',
  },
  shuffleBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: 'rgba(99, 102, 241, 0.08)',
    color: '#818cf8',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
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
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  finishedActions: {
    display: 'flex',
    gap: 12,
    width: '100%',
    marginTop: 8,
  }
};
