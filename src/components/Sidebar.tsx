import React from 'react';
import { BookOpen, Plus, GraduationCap, X, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: 'dashboard' | 'import' | 'mock-test-dashboard') => void;
  deckCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  deckCount,
  isOpen,
  onClose,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as const,
      label: 'Bài học',
      icon: <BookOpen size={18} />,
      badge: deckCount > 0 ? deckCount.toString() : undefined,
    },
    {
      id: 'import' as const,
      label: 'Thêm bài học',
      icon: <Plus size={18} />,
    },
    {
      id: 'mock-test-dashboard' as const,
      label: 'Đề thi mẫu',
      icon: <GraduationCap size={18} />,
      badge: 'Thi thử',
    },
  ];

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div 
          style={styles.backdrop} 
          onClick={onClose}
          className="fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside 
        style={{
          ...styles.sidebar,
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
        className={isOpen ? 'sidebar-open' : 'sidebar-closed'}
      >
        {/* Header/Logo */}
        <div style={styles.header}>
          <div style={styles.logo} onClick={() => { onNavigate('dashboard'); onClose(); }}>
            <div style={styles.logoIcon}>
              <BookOpen size={18} color="#a78bfa" />
            </div>
            <span className="logo-text" style={{ fontSize: 16 }}>QuizMaster</span>
          </div>
          
          <button style={styles.closeBtn} onClick={onClose} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>

        {/* AI Badge decoration */}
        <div style={styles.badgeContainer}>
          <div style={styles.aiBadge}>
            <Sparkles size={10} color="#a78bfa" style={{ marginRight: 4 }} />
            <span>AI Quiz Generation</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = currentView === item.id || 
              (item.id === 'mock-test-dashboard' && (currentView === 'mock-test-play' || currentView === 'mock-test-results'));
            
            return (
              <button
                key={item.id}
                style={{
                  ...styles.navBtn,
                  background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                  borderColor: isActive ? 'var(--border-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                className="btn-option-hover"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              >
                <div style={styles.btnContent}>
                  <span style={{ 
                    ...styles.btnIcon,
                    color: isActive ? '#a78bfa' : 'var(--text-muted)' 
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                </div>
                
                {item.badge && (
                  <span style={{
                    ...styles.badge,
                    background: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom decoration/Stats summary */}
        <div style={styles.footer}>
          <div style={styles.statsCard}>
            <div style={styles.statsLabel}>Hệ thống lưu trữ</div>
            <div style={styles.statsValue}>{deckCount} Bài học học phần</div>
            <div style={styles.statsSubText}>Lưu trữ offline trên thiết bị</div>
          </div>
        </div>
      </aside>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    width: '260px',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-muted)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease',
    padding: '24px 16px',
    boxShadow: 'var(--glow-shadow)',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    // Hidden by default, displayed via media query in CSS
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 4,
    borderRadius: '50%',
  },
  badgeContainer: {
    marginBottom: 24,
  },
  aiBadge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.12)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: 9,
    fontWeight: 600,
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    width: 'max-content',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid transparent',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    width: '100%',
    textAlign: 'left',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  btnIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTop: '1px solid var(--border-muted)',
  },
  statsCard: {
    background: 'rgba(124, 92, 246, 0.03)',
    border: '1px solid var(--border-muted)',
    borderRadius: '12px',
    padding: '12px',
  },
  statsLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 2,
  },
  statsSubText: {
    fontSize: 10,
    color: 'var(--text-muted)',
  }
};
