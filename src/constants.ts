export const DEFAULT_AI_PROMPT = `Bạn là một trợ lý ôn thi cá nhân. Hãy đọc tài liệu đính kèm và trích xuất TOÀN BỘ câu hỏi trắc nghiệm. 

YÊU CẦU ĐẦU RA:
- Hãy lưu toàn bộ dữ liệu câu hỏi trắc nghiệm dưới dạng tệp tin văn bản đặt tên là "quizmaster.txt" để tôi có thể tải xuống trực tiếp.
- Định dạng nội dung bên trong file phải viết đúng theo cấu trúc siêu rút gọn dưới đây để tránh vượt quá giới hạn ký tự (Token Limit).
- Nếu nền tảng của bạn không hỗ trợ tạo tệp tin tải xuống (như Gemini), hãy in trực tiếp văn bản thô này vào khung chat.

ĐỊNH DẠNG NỘI DUNG (Xuất liên tục cho tất cả câu hỏi, cách nhau bằng 1 dòng trống):
Q: [Nội dung câu hỏi]
A: [Lựa chọn A]
B: [Lựa chọn B]
C: [Lựa chọn C]
D: [Lựa chọn D]
K: [Chữ cái đáp án đúng, ví dụ: A hoặc B hoặc C hoặc D]
E: [Giải thích lý do chọn đáp án hoặc kiến thức liên quan]
S: [true nếu đáp án là do AI tự suy luận giải, false nếu đáp án có sẵn trong tài liệu gốc]

LƯU Ý CỰC KỲ QUAN TRỌNG:
1. Nhận diện đáp án đúng: Hãy tìm xem đáp án đúng trong tài liệu gốc có được gạch chân (underline), in đậm (bold) hay tô màu khác biệt không. Nếu có, hãy trích xuất đáp án đó và đặt "S: false".
2. Tự giải đề: Nếu tài liệu không ghi rõ đáp án đúng, bạn hãy tự suy luận/giải câu hỏi đó dựa trên cơ sở tri thức của bạn để chọn đáp án đúng nhất, đồng thời bắt buộc đặt "S: true".
3. TRÁNH LỖI CÚ PHÁP: Không dùng bất kỳ cấu trúc JSON, dấu ngoặc hay dấu phẩy bao ngoài nào khác. Chỉ viết đúng theo định dạng thô ở trên.
4. Trích xuất đầy đủ toàn bộ câu hỏi có trong tài liệu, không lược bỏ câu nào.`;
