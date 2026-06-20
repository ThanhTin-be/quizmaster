import React, { useState, useEffect, useRef } from 'react';
import type { Deck, Question, MockTestConfig, MockTestHistoryItem } from '../types';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Award, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface MockTestPlayProps {
  config?: MockTestConfig;
  decks: Deck[];
  onSaveResult?: (item: Omit<MockTestHistoryItem, 'id' | 'date'>) => void;
  onBack: () => void;
  reviewItem?: MockTestHistoryItem;
}

export const MockTestPlay: React.FC<MockTestPlayProps> = ({
  config,
  decks,
  onSaveResult,
  onBack,
  reviewItem,
}) => {
  // Question pool and loading
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(reviewItem ? 0 : (config?.durationMinutes || 0) * 60);
  const [timeSpent, setTimeSpent] = useState(reviewItem ? reviewItem.timeSpentSeconds : 0);
  
  // Refs
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Helper function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 1. Generate exam questions or load review item on mount
  useEffect(() => {
    if (reviewItem) {
      setQuestions(reviewItem.questions);
      setUserAnswers(reviewItem.userAnswers);
      setIsSubmitted(true);
      return;
    }

    if (!config) return;

    const deckA = decks.find(d => d.id === config.deckAId);
    const deckB = config.deckBId ? decks.find(d => d.id === config.deckBId) : undefined;
    
    let selectedQ: Question[] = [];

    // Get questions from Deck A
    if (deckA) {
      let qA = [...deckA.questions];
      if (config.selectionMode === 'random') {
        qA = shuffleArray(qA);
      }
      // Sequential/Random - take the required amount
      selectedQ.push(...qA.slice(0, config.deckAQuestionCount));
    }

    // Get questions from Deck B
    if (deckB) {
      let qB = [...deckB.questions];
      if (config.selectionMode === 'random') {
        qB = shuffleArray(qB);
      }
      selectedQ.push(...qB.slice(0, config.deckBQuestionCount));
    }

    // Shuffle the combined set so they are mixed together in the exam
    setQuestions(shuffleArray(selectedQ));
    startTimeRef.current = Date.now();
  }, [config, decks, reviewItem]);

  // 2. Timer effect
  useEffect(() => {
    if (isSubmitted || reviewItem || !config) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Timer interval ticks every second
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
      
      if (config.durationMinutes > 0) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Trigger auto-submit
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, config, reviewItem]);

  const handleAutoSubmit = () => {
    alert('Hết giờ làm bài! Hệ thống tự động nộp bài thi.');
    submitTest(userAnswers, true);
  };

  // Answer selection
  const handleSelectOption = (optionLabel: string) => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setUserAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionLabel
    }));
  };

  // Submit test processing
  const submitTest = (answers: Record<string, string> = userAnswers) => {
    setIsSubmitted(true);
    
    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const elapsedSeconds = (config && config.durationMinutes > 0) 
      ? (config.durationMinutes * 60 - timeLeft) 
      : timeSpent;

    if (onSaveResult && config) {
      onSaveResult({
        title: config.title,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        durationMinutes: config.durationMinutes,
        timeSpentSeconds: elapsedSeconds,
        questions,
        userAnswers: answers,
      });
    }
  };

  const handleManualSubmit = () => {
    const unansweredCount = questions.length - Object.keys(userAnswers).length;
    let confirmMsg = 'Bạn có chắc chắn muốn nộp bài thi?';
    if (unansweredCount > 0) {
      confirmMsg = `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài thi?`;
    }
    
    if (confirm(confirmMsg)) {
      submitTest();
    }
  };

  // Navigation helpers
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  // Format MM:SS for countdown timer
  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rSecs.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (questions.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="animate-spin" size={32} color="#a78bfa" />
        <span style={{ marginTop: 12 }}>Đang chuẩn bị đề thi mẫu...</span>
      </div>
    );
  }

  // Active question details
  const currentQuestion = questions[currentIndex];
  const selectedOption = userAnswers[currentQuestion?.id] || null;

  // 3. Render Results View if submitted
  if (isSubmitted) {
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) score++;
    });
    const accuracy = Math.round((score / questions.length) * 100);
    const totalTimeSpent = reviewItem ? reviewItem.timeSpentSeconds : (config?.durationMinutes && config.durationMinutes > 0 ? (config.durationMinutes * 60 - timeLeft) : timeSpent);

    return (
      <div className="fade-in-up" style={styles.container}>
        {/* Result summary banner */}
        <div className="double-bezel" style={{ marginBottom: 32 }}>
          <div className="double-bezel-inner" style={styles.resultSummaryInner}>
            <div style={styles.successIcon}>
              <Award size={48} color="#a78bfa" />
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Kết Quả Đề Thi Thử</h2>
            <h3 style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: 16, marginBottom: 20 }}>
              {reviewItem ? reviewItem.title : config?.title}
            </h3>

            {/* Score and Stats grid */}
            <div style={styles.resultStatsRow}>
              <div style={styles.resultStatBox}>
                <span style={{ ...styles.resultStatValue, color: '#10b981' }}>{score}</span>
                <span style={styles.resultStatLabel}>Đúng</span>
              </div>
              <div style={styles.resultStatBox}>
                <span style={{ ...styles.resultStatValue, color: '#ef4444' }}>{questions.length - score}</span>
                <span style={styles.resultStatLabel}>Sai</span>
              </div>
              <div style={styles.resultStatBox}>
                <span style={styles.resultStatValue}>{accuracy}%</span>
                <span style={styles.resultStatLabel}>Tỉ lệ chính xác</span>
              </div>
              <div style={styles.resultStatBox}>
                <span style={styles.resultStatValue}>{formatCountdown(totalTimeSpent)}</span>
                <span style={styles.resultStatLabel}>Thời gian</span>
              </div>
            </div>

            {/* Feedback badge */}
            <div style={{
              ...styles.feedbackBadge,
              background: accuracy >= 80 ? 'rgba(16, 185, 129, 0.08)' : accuracy >= 50 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              color: accuracy >= 80 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444',
              borderColor: accuracy >= 80 ? 'rgba(16, 185, 129, 0.2)' : accuracy >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            }}>
              {accuracy >= 90 ? '🏆 Xuất sắc! Bạn đã nắm rất vững kiến thức.' : 
               accuracy >= 80 ? '🌟 Rất tốt! Tiếp tục phát huy nhé.' :
               accuracy >= 65 ? '👍 Khá tốt. Hãy ôn lại những câu làm sai.' :
               accuracy >= 50 ? '⚡ Đạt. Bạn cần ôn tập thêm một chút.' :
               '📚 Cần cố gắng thêm. Hãy xem kỹ phần giải thích chi tiết.'}
            </div>

            <div style={styles.resultActions}>
              <button className="btn-secondary" onClick={onBack} style={{ flex: 1, justifyContent: 'center' }}>
                Quay lại Trang Đề thi
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Xem lại chi tiết bài làm</h3>
        <div style={styles.reviewList}>
          {questions.map((q, qIdx) => {
            const userAns = userAnswers[q.id];
            const isCorrect = userAns === q.correctAnswer;
            
            return (
              <div key={q.id} className="double-bezel" style={{ marginBottom: 20 }}>
                <div className="double-bezel-inner" style={styles.reviewCardInner}>
                  {/* Review Card Header */}
                  <div style={styles.reviewHeader}>
                    <span style={styles.reviewIndex}>Câu hỏi {qIdx + 1}</span>
                    <span style={{
                      ...styles.resultBadge,
                      background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: isCorrect ? '#10b981' : '#ef4444',
                      borderColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    }}>
                      {isCorrect ? (
                        <>
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                          Chính xác
                        </>
                      ) : (
                        <>
                          <XCircle size={12} style={{ marginRight: 4 }} />
                          {userAns ? 'Chưa chính xác' : 'Chưa trả lời'}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div style={styles.reviewQuestionText}>{q.question}</div>

                  {/* Options List */}
                  <div style={styles.reviewOptionsList}>
                    {q.options.map((opt, oIdx) => {
                      const optLabel = opt.trim().charAt(0);
                      const isOptionSelected = userAns === optLabel;
                      const isOptionCorrect = q.correctAnswer === optLabel;
                      
                      let optStyle = { ...styles.reviewOption };
                      
                      if (isOptionCorrect) {
                        optStyle = {
                          ...optStyle,
                          borderColor: 'rgba(16, 185, 129, 0.5)',
                          background: 'rgba(16, 185, 129, 0.06)',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                        };
                      } else if (isOptionSelected) {
                        optStyle = {
                          ...optStyle,
                          borderColor: 'rgba(239, 68, 68, 0.5)',
                          background: 'rgba(239, 68, 68, 0.06)',
                          color: 'var(--text-primary)',
                        };
                      } else {
                        optStyle = {
                          ...optStyle,
                          opacity: 0.6,
                        };
                      }

                      return (
                        <div key={oIdx} style={optStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              ...styles.optionIndicator,
                              background: isOptionCorrect ? '#10b981' : isOptionSelected ? '#ef4444' : 'transparent',
                              borderColor: isOptionCorrect ? '#10b981' : isOptionSelected ? '#ef4444' : 'var(--border-muted)',
                            }}>
                              {isOptionCorrect ? <CheckCircle2 size={12} color="#ffffff" /> : 
                               isOptionSelected ? <XCircle size={12} color="#ffffff" /> :
                               <span style={{ fontSize: 10, fontWeight: 700 }}>{optLabel}</span>}
                            </div>
                            <span>{opt}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {(q.explanation || !isCorrect) && (
                    <div style={styles.explanationBox}>
                      <div style={styles.explanationTitle}>ĐÁP ÁN ĐÚNG: {q.correctAnswer}</div>
                      {q.explanation && (
                        <div style={styles.explanationTextContent}>
                          <strong>Giải thích:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Render Active Exam taking UI
  return (
    <div className="fade-in-up" style={styles.container}>
      {/* Top Exam Info Bar */}
      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={() => {
          if (confirm('Bạn có chắc chắn muốn thoát khỏi phòng thi? Tiến độ làm bài sẽ bị mất.')) {
            onBack();
          }
        }}>
          <ArrowLeft size={16} /> Thoát phòng thi
        </button>
        <span style={styles.examTitle}>{config?.title}</span>
        
        {/* Dynamic Timer display */}
        <div style={styles.timerBadge}>
          <Clock size={16} color="#a78bfa" style={{ marginRight: 6 }} />
          {config && config.durationMinutes > 0 ? (
            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>
              {formatCountdown(timeLeft)}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Đang làm: {formatCountdown(timeSpent)}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressLineBg}>
        <div style={{ 
          ...styles.progressLineFill, 
          width: `${((currentIndex + 1) / questions.length) * 100}%` 
        }} />
      </div>

      <div style={styles.examGrid}>
        {/* Left Column: Active Question panel */}
        <div className="double-bezel" style={{ flex: 1 }}>
          <div className="double-bezel-inner" style={styles.cardInner}>
            <div style={styles.cardHeader}>
              <div style={styles.scoreBadge}>CÂU HỎI {currentIndex + 1} / {questions.length}</div>
              <div style={styles.statusLabel}>
                {selectedOption ? (
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>✓ Đã chọn đáp án</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>⚠ Chưa trả lời</span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div style={styles.questionText}>
              {currentQuestion.question}
            </div>

            {/* Options List */}
            <div style={styles.optionsList}>
              {currentQuestion.options.map((opt, i) => {
                const optLabel = opt.trim().charAt(0);
                const isSelected = selectedOption === optLabel;
                
                return (
                  <button
                    key={i}
                    style={{
                      ...styles.optionButton,
                      borderColor: isSelected ? 'var(--border-active)' : 'var(--border-muted)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 600 : 500,
                    }}
                    onClick={() => handleSelectOption(optLabel)}
                    className="btn-option-hover"
                  >
                    <div style={styles.optionContent}>
                      <div style={{
                        ...styles.optionIndicator,
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-muted)',
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700 }}>{optLabel}</span>
                      </div>
                      <span style={{ textAlign: 'left' }}>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div style={styles.navigationRow}>
              <button
                className="btn-secondary"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{
                  ...styles.navBtn,
                  opacity: currentIndex === 0 ? 0.4 : 1,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={16} /> Câu trước
              </button>
              
              <button
                className="btn-secondary"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                style={{
                  ...styles.navBtn,
                  opacity: currentIndex === questions.length - 1 ? 0.4 : 1,
                  cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Câu tiếp theo <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question grid navigator & submit */}
        <div style={styles.sidebarPanel}>
          <div className="double-bezel">
            <div className="double-bezel-inner" style={styles.sidebarInner}>
              <h3 style={styles.sidebarTitle}>Tiến độ làm bài</h3>
              
              {/* Grid representation */}
              <div style={styles.questionsGrid}>
                {questions.map((q, idx) => {
                  const hasAnswered = !!userAnswers[q.id];
                  const isCurrent = idx === currentIndex;
                  
                  let btnBg = 'transparent';
                  let btnBorder = 'var(--border-muted)';
                  let textColor = 'var(--text-secondary)';
                  let shadowGlow = 'none';

                  if (hasAnswered) {
                    btnBg = 'rgba(139, 92, 246, 0.08)';
                    btnBorder = 'rgba(139, 92, 246, 0.3)';
                    textColor = '#a78bfa';
                  }

                  if (isCurrent) {
                    btnBorder = 'var(--accent)';
                    textColor = 'var(--text-primary)';
                    shadowGlow = '0 0 8px rgba(139, 92, 246, 0.2)';
                  }

                  return (
                    <button
                      key={q.id}
                      style={{
                        ...styles.gridItem,
                        background: btnBg,
                        borderColor: btnBorder,
                        color: textColor,
                        boxShadow: shadowGlow,
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                      onClick={() => setCurrentIndex(idx)}
                      title={`Đến câu hỏi số ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Status information */}
              <div style={styles.progressSummary}>
                <div style={styles.summaryItem}>
                  <div style={{ ...styles.colorDot, background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6' }} />
                  <span>Đã trả lời: {Object.keys(userAnswers).length} / {questions.length}</span>
                </div>
                <div style={styles.summaryItem}>
                  <div style={{ ...styles.colorDot, background: 'transparent', border: '1px solid var(--border-muted)' }} />
                  <span>Chưa làm: {questions.length - Object.keys(userAnswers).length} câu</span>
                </div>
              </div>

              {/* Final Submit action */}
              <button 
                className="btn-primary" 
                onClick={handleManualSubmit}
                style={styles.submitBtnSidebar}
              >
                Nộp bài thi
                <div className="btn-icon-circle">
                  <span>✓</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
    paddingBottom: 60,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: 'var(--text-secondary)',
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
  examTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  timerBadge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    padding: '6px 14px',
    borderRadius: '9999px',
    color: '#a78bfa',
  },
  progressLineBg: {
    height: 4,
    background: 'var(--bg-surface-elevated)',
    borderRadius: 2,
    width: '100%',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressLineFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  examGrid: {
    display: 'flex',
    gap: 24,
    alignItems: 'start',
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
    borderBottom: '1px solid var(--border-muted)',
    paddingBottom: 12,
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
  statusLabel: {
    fontSize: 12,
  },
  questionText: {
    fontSize: 18,
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
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
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
  navigationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--border-muted)',
    paddingTop: 20,
    marginTop: 8,
  },
  navBtn: {
    padding: '10px 16px',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sidebarPanel: {
    width: '260px',
    flexShrink: 0,
  },
  sidebarInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 700,
    borderBottom: '1px solid var(--border-muted)',
    paddingBottom: 10,
  },
  questionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
  },
  gridItem: {
    aspectRatio: '1',
    borderRadius: '8px',
    border: '1px solid var(--border-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 12,
    outline: 'none',
    transition: 'all 150ms ease',
  },
  progressSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  submitBtnSidebar: {
    width: '100%',
    justifyContent: 'center',
    padding: '12px',
    fontSize: 13,
    marginTop: 8,
  },
  // Result styles
  resultSummaryInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px 24px',
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
    marginBottom: 16,
  },
  resultStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    width: '100%',
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
    padding: '16px 8px',
    borderRadius: '16px',
    marginBottom: 20,
  },
  resultStatBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'center',
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  resultStatLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  feedbackBadge: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: 13,
    fontWeight: 600,
    width: '100%',
    textAlign: 'center',
    marginBottom: 24,
  },
  resultActions: {
    display: 'flex',
    width: '100%',
    gap: 12,
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
  },
  reviewCardInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-muted)',
    paddingBottom: 10,
  },
  reviewIndex: {
    fontSize: 13,
    fontWeight: 700,
    color: '#a78bfa',
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: 700,
    border: '1px solid',
    padding: '2px 8px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  reviewQuestionText: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.5,
    color: 'var(--text-primary)',
  },
  reviewOptionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  reviewOption: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border-muted)',
    fontSize: 13,
    color: 'var(--text-secondary)',
    background: 'var(--bg-surface-elevated)',
  },
  explanationBox: {
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  explanationTitle: {
    fontSize: 10,
    fontWeight: 800,
    color: '#a78bfa',
    letterSpacing: '0.05em',
    marginBottom: 4,
  },
  explanationTextContent: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  }
};
