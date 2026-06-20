import React, { useState } from 'react';
import type { Deck } from '../types';
import { DEFAULT_AI_PROMPT } from '../constants';
import { Copy, Check, ArrowLeft, Terminal, AlertCircle } from 'lucide-react';

interface ImportDeckProps {
  decks: Deck[];
  onImport: (name: string, jsonString: string, appendToDeckId?: string) => boolean; // returns true if successful
  onCancel: () => void;
}

export const ImportDeck: React.FC<ImportDeckProps> = ({ decks, onImport, onCancel }) => {
  const [deckName, setDeckName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [importMode, setImportMode] = useState<'new' | 'append'>('new');
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_AI_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (importMode === 'new' && !deckName.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setDeckName(nameWithoutExt);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (importMode === 'new' && !deckName.trim()) {
      setError('Vui lòng nhập tên bài học (ví dụ: Word, Excel).');
      return;
    }

    if (importMode === 'append' && !selectedDeckId) {
      setError('Vui lòng chọn bài học có sẵn để ghép câu hỏi.');
      return;
    }

    if (!jsonText.trim()) {
      setError('Vui lòng dán chuỗi JSON hoặc tải file .json câu hỏi.');
      return;
    }

    const success = onImport(
      importMode === 'new' ? deckName.trim() : '', 
      jsonText.trim(),
      importMode === 'append' ? selectedDeckId : undefined
    );
    if (!success) {
      setError('Định dạng JSON không hợp lệ hoặc thiếu thông tin câu hỏi. Vui lòng kiểm tra lại cấu trúc JSON được trả về từ AI.');
    }
  };

  return (
    <div className="fade-in-up" style={styles.container}>
      <button style={styles.backBtn} onClick={onCancel}>
        <ArrowLeft size={16} />
        Quay lại bảng điều khiển
      </button>

      <div style={styles.header}>
        <h1>Thêm Bài Học Mới</h1>
        <p>Thực hiện theo 2 bước đơn giản dưới đây để tự tạo bộ câu hỏi trắc nghiệm của bạn.</p>
      </div>

      <div style={styles.layout}>
        {/* Step 1: Copy Prompt */}
        <div className="double-bezel" style={styles.stepCard}>
          <div className="double-bezel-inner" style={styles.stepInner}>
            <div style={styles.stepHeader}>
              <div style={styles.stepBadge}>Bước 1</div>
              <h3>Lấy Prompt Cho AI</h3>
            </div>
            
            <p style={styles.stepDesc}>
              Copy câu lệnh (Prompt) bên dưới, dán kèm tài liệu PDF hoặc văn bản bài học của bạn vào ChatGPT, Claude hoặc Gemini. AI sẽ tạo file tải xuống hoặc in kết quả trực tiếp trong chat.
            </p>

            <div style={styles.promptBox}>
              <div style={styles.promptBoxHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <Terminal size={14} />
                  <span>AI PROMPT TEMPLATE</span>
                </div>
                <button style={styles.copyBtn} onClick={handleCopyPrompt}>
                  {copied ? (
                    <>
                      <Check size={14} color="#10b981" />
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Đã copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <textarea 
                readOnly 
                value={DEFAULT_AI_PROMPT} 
                style={styles.promptTextarea} 
              />
            </div>
          </div>
        </div>

        {/* Step 2: Paste JSON */}
        <div className="double-bezel" style={styles.stepCard}>
          <div className="double-bezel-inner" style={styles.stepInner}>
            <div style={styles.stepHeader}>
              <div style={styles.stepBadge}>Bước 2</div>
              <h3>Nạp Dữ Liệu Bài Học</h3>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Hình thức nạp bài</label>
                <div style={styles.modeTabs}>
                  <button 
                    type="button"
                    style={{
                      ...styles.modeTab,
                      background: importMode === 'new' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      borderColor: importMode === 'new' ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-muted)',
                      color: importMode === 'new' ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                    onClick={() => setImportMode('new')}
                  >
                    Tạo đề mới
                  </button>
                  <button 
                    type="button"
                    disabled={decks.length === 0}
                    style={{
                      ...styles.modeTab,
                      background: importMode === 'append' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      borderColor: importMode === 'append' ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-muted)',
                      color: importMode === 'append' ? 'var(--text-primary)' : 'var(--text-muted)',
                      opacity: decks.length === 0 ? 0.4 : 1,
                      cursor: decks.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => {
                      if (decks.length > 0) {
                        setImportMode('append');
                        if (!selectedDeckId) setSelectedDeckId(decks[0].id);
                      }
                    }}
                    title={decks.length === 0 ? "Chưa có bài học nào trong hệ thống để ghép câu hỏi" : ""}
                  >
                    Ghép vào đề có sẵn
                  </button>
                </div>
              </div>

              {importMode === 'new' ? (
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="deckName">Tên bài học mới (Tên đề ôn thi)</label>
                  <input 
                    id="deckName"
                    type="text" 
                    placeholder="Ví dụ: Ôn tập Excel, Trắc nghiệm Lịch sử 12..." 
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              ) : (
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="existingDeckSelect">Chọn bài học để ghép câu hỏi</label>
                  <select 
                    id="existingDeckSelect"
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    style={styles.select}
                  >
                    {decks.map(d => (
                      <option key={d.id} value={d.id} style={styles.option}>
                        {d.name} ({d.questions.length} câu hỏi)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={styles.label} htmlFor="jsonInput">Dán văn bản hoặc tải file dữ liệu (.json, .txt)</label>
                  <label htmlFor="fileUpload" style={styles.fileUploadLabel}>
                    Chọn File (.json, .txt)
                  </label>
                  <input 
                    id="fileUpload"
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <textarea 
                  id="jsonInput"
                  placeholder='Dán dữ liệu từ AI vào đây (format: Q:, A:, B:, C:, D:, ANS:, EXP:) hoặc tải file .txt/.json...' 
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  style={styles.jsonTextarea}
                />
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div style={styles.formActions}>
                <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  Nạp bài học vào app
                  <div className="btn-icon-circle">
                    <span>↗</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
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
    marginBottom: 24,
    transition: 'var(--transition-fluid)',
  },
  header: {
    marginBottom: 36,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  stepCard: {
    height: '100%',
  },
  stepInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  promptBox: {
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-muted)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  promptBoxHeader: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-muted)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--theme-toggle-bg)',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: '#a78bfa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  promptTextarea: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.5,
    padding: '12px',
    resize: 'none',
    minHeight: '260px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  fileUploadLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#a78bfa',
    cursor: 'pointer',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
    transition: 'var(--transition-fluid)',
  },
  modeTabs: {
    display: 'flex',
    gap: 8,
    width: '100%',
  },
  modeTab: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--border-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 200ms ease',
    outline: 'none',
  },
  select: {
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
    transition: 'var(--transition-fluid)',
  },
  option: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
  },
  input: {
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'var(--transition-fluid)',
  },
  jsonTextarea: {
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '12px',
    color: 'var(--text-primary)',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    lineHeight: 1.5,
    outline: 'none',
    resize: 'none',
    minHeight: '220px',
    transition: 'var(--transition-fluid)',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 1.4,
  },
  formActions: {
    display: 'flex',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 12,
  }
};
// Add media query styling via script when resizing
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    // Dynamic media query adjustment
    const layout = document.querySelector('[style*="gridTemplateColumns"]');
    if (layout) {
      if (window.innerWidth < 768) {
        (layout as HTMLElement).style.gridTemplateColumns = '1fr';
      } else {
        (layout as HTMLElement).style.gridTemplateColumns = '1fr 1fr';
      }
    }
  });
}
