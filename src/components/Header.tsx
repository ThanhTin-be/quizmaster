import React, { useState } from 'react';
import { BookOpen, Sparkles, Menu, Palette } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  onGoImport: () => void;
  deckCount: number;
  theme: 'dark' | 'light' | 'pink-dark' | 'pink-light';
  onChangeTheme: (theme: 'dark' | 'light' | 'pink-dark' | 'pink-light') => void;
  onOpenSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onGoHome, 
  theme, 
  onChangeTheme,
  onOpenSidebar,
  isSidebarCollapsed,
  onToggleSidebar
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const themeOptions = [
    { id: 'dark' as const, label: 'Tối (Mặc định)', dotColor: '#8b5cf6' },
    { id: 'light' as const, label: 'Sáng', dotColor: '#7c3aed' },
    { id: 'pink-dark' as const, label: 'Hồng Tối', dotColor: '#ec4899' },
    { id: 'pink-light' as const, label: 'Hồng Sáng', dotColor: '#db2777' },
  ];

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.leftSection}>
          <button 
            onClick={onOpenSidebar}
            style={styles.menuBtn}
            title="Mở menu"
            className="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={onToggleSidebar}
            className="items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground flex h-10 w-10 text-muted-foreground sidebar-toggle-btn desktop-only"
            title={isSidebarCollapsed ? "Mở thanh bên" : "Ẩn thanh bên"}
          >
            {isSidebarCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m17 15-3-3 3-3" /></svg>
            )}
          </button>

          <div style={styles.logo} onClick={onGoHome}>
            <div style={styles.logoIcon}>
              <BookOpen size={16} color="#a78bfa" />
            </div>
            <span className="logo-text" style={{ fontSize: 16 }}>QuizMaster</span>
            <div style={styles.badge} className="desktop-only">
              <Sparkles size={8} color="#a78bfa" style={{ marginRight: 4 }} />
              <span>AI Powered</span>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              style={styles.themeToggle}
              title="Chọn giao diện"
            >
              <Palette size={16} color={
                theme === 'pink-dark' ? '#f472b6' : 
                theme === 'pink-light' ? '#db2777' : 
                theme === 'dark' ? '#a78bfa' : '#7c3aed'
              } />
            </button>

            {menuOpen && (
              <>
                <div 
                  style={styles.dropdownBackdrop} 
                  onClick={() => setMenuOpen(false)}
                />
                <div style={styles.dropdownMenu} className="fade-in">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onChangeTheme(opt.id);
                        setMenuOpen(false);
                      }}
                      style={styles.dropdownItem}
                      className="dropdown-item-hover"
                    >
                      <div style={styles.itemLabelSection}>
                        <div style={{ ...styles.colorDot, background: opt.dotColor }} />
                        <span>{opt.label}</span>
                      </div>
                      {theme === opt.id && (
                        <span style={styles.activeIndicator}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 16,
    zIndex: 900,
    width: '100%',
    marginBottom: 28,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--header-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border-muted)',
    borderRadius: '9999px',
    padding: '10px 20px',
    boxShadow: 'var(--header-shadow)',
    width: '100%',
    transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: 6,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 200ms ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
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
  badge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: 9,
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
  themeToggle: {
    background: 'var(--theme-toggle-bg)',
    border: '1px solid var(--border-muted)',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-fluid)',
    outline: 'none',
    padding: 0,
  },
  dropdownBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    background: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '42px',
    right: 0,
    width: '180px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-muted)',
    borderRadius: '12px',
    padding: '6px',
    boxShadow: 'var(--glow-shadow)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'left',
  },
  itemLabelSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  colorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  activeIndicator: {
    color: 'var(--accent-light)',
    fontSize: '12px',
    fontWeight: 'bold',
  }
};
