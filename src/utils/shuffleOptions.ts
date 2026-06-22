import type { Question } from '../types';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface ShuffledQuestion {
  /** Mảng options đã được xáo trộn và gán nhãn mới (vd: "A. Trên 3", "B. 1", ...) */
  shuffledOptions: string[];
  /** Map từ nhãn hiển thị mới → nhãn gốc (vd: { A: "D", B: "A", C: "C", D: "B" }) */
  displayToOriginalLabel: Record<string, string>;
  /** Map từ nhãn gốc → nhãn hiển thị mới (vd: { D: "A", A: "B", ... }) */
  originalToDisplayLabel: Record<string, string>;
  /** Nhãn hiển thị tương ứng với đáp án đúng (vd: "A") */
  correctDisplayLabel: string;
}

/**
 * Xáo trộn thứ tự đáp án của một câu hỏi.
 * Dữ liệu gốc không bị thay đổi — chỉ tạo ra một "bản hiển thị" ngẫu nhiên.
 *
 * @param question - Câu hỏi gốc
 * @returns ShuffledQuestion chứa đáp án đã xáo trộn và các map ánh xạ nhãn
 */
export function shuffleOptions(question: Question): ShuffledQuestion {
  const originalOptions = question.options; // vd: ["A. 1", "B. 2", "C. 3", "D. Trên 3"]

  // Tạo mảng index [0, 1, 2, 3] rồi shuffle
  const indices = originalOptions.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const displayToOriginalLabel: Record<string, string> = {};
  const originalToDisplayLabel: Record<string, string> = {};
  const shuffledOptions: string[] = [];

  indices.forEach((originalIndex, newIndex) => {
    const newLabel = LABELS[newIndex]; // nhãn mới: A, B, C, D
    const originalOption = originalOptions[originalIndex]; // vd: "D. Trên 3"

    // Lấy nhãn gốc từ ký tự đầu của option
    const originalLabel = originalOption.trim().charAt(0).toUpperCase(); // "D"

    // Thay thế nhãn gốc bằng nhãn mới trong text hiển thị
    // "D. Trên 3" → "A. Trên 3"
    const newOptionText = originalOption.trim().replace(/^[A-Z][.:)\s]/, `${newLabel}. `);
    shuffledOptions.push(newOptionText);

    displayToOriginalLabel[newLabel] = originalLabel;
    originalToDisplayLabel[originalLabel] = newLabel;
  });

  // Nhãn hiển thị của đáp án đúng
  const correctDisplayLabel = originalToDisplayLabel[question.correctAnswer] ?? question.correctAnswer;

  return {
    shuffledOptions,
    displayToOriginalLabel,
    originalToDisplayLabel,
    correctDisplayLabel,
  };
}

/**
 * Tính trước shuffle cho toàn bộ danh sách câu hỏi (gọi 1 lần lúc khởi tạo session).
 */
export function buildShuffleMap(questions: Question[]): ShuffledQuestion[] {
  return questions.map(q => shuffleOptions(q));
}
