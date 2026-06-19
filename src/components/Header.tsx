import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  onGoImport: () => void;
  deckCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, onGoImport, deckCount }) => {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.logo} onClick={onGoHome}>
          <div style={styles.logoIcon}>
            <BookOpen size={20} color="#a78bfa" />
          </div>
          <span style={styles.logoText}>QuizMaster</span>
          <div style={styles.badge}>
            <Sparkles size={10} color="#a78bfa" style={{ marginRight: 4 }} />
            <span>AI Powered</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button 
            className="btn-secondary" 
            style={styles.navBtn}
            onClick={onGoHome}
          >
            Bài học ({deckCount})
          </button>
          <button 
            className="btn-primary" 
            style={styles.navBtnPrimary}
            onClick={onGoImport}
          >
            Thêm bài học
            <div className="btn-icon-circle">
              <span>+</span>
            </div>
          </button>
        </nav>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 24,
    zIndex: 100,
    width: '100%',
    marginBottom: 40,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(10, 10, 12, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '9999px',
    padding: '12px 24px',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: '#ffffff',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: 10,
    fontWeight: 600,
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    padding: '8px 16px',
    fontSize: 13,
  },
  navBtnPrimary: {
    padding: '6px 14px 6px 18px',
    fontSize: 13,
  }
};
