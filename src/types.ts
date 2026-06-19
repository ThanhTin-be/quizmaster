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
