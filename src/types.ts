export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // "A", "B", "C", "D", etc.
  explanation?: string;
  isSolvedByAi?: boolean; // True if the AI solved it rather than extracting it
}

export interface DeckProgress {
  correctQuestions: string[]; // IDs of correctly answered questions
  wrongQuestions: string[]; // IDs of incorrectly answered questions
  starredQuestions: string[]; // IDs of favorited questions for quick review
}

export interface Deck {
  id: string;
  name: string;
  questions: Question[];
  createdAt: number;
  progress: DeckProgress;
}

export interface MockTestConfig {
  title: string;
  durationMinutes: number; // 0 = Không giới hạn
  selectionMode: 'random' | 'sequential';
  deckAId: string;
  deckBId?: string;
  deckAQuestionCount: number;
  deckBQuestionCount: number;
}

export interface MockTestHistoryItem {
  id: string;
  title: string;
  date: number;
  totalQuestions: number;
  correctAnswers: number;
  durationMinutes: number; // Thời gian giới hạn cấu hình (phút)
  timeSpentSeconds: number; // Thời gian làm bài thực tế (giây)
  questions: Question[]; // Lưu lại câu hỏi để ôn tập/xem lại
  userAnswers: Record<string, string>; // questionId -> đáp án đã chọn (A, B, C, D...)
}

