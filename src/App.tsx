import { useState, useEffect } from 'react';
import type { Deck, Question, MockTestConfig, MockTestHistoryItem } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ImportDeck } from './components/ImportDeck';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { ReviewView } from './components/ReviewView';
import { Sidebar } from './components/Sidebar';
import { MockTestDashboard } from './components/MockTestDashboard';
import { MockTestPlay } from './components/MockTestPlay';

const LOCAL_STORAGE_KEY = 'quizmaster_decks';

const parseCustomFormat = (text: string): Question[] => {
  const questions: Question[] = [];
  const blocks = text.split(/(?=^Q:|^Câu hỏi:)/m);
  
  blocks.forEach((block, index) => {
    if (!block.trim()) return;
    
    let questionText = '';
    const options: string[] = [];
    let correctAnswer = '';
    let explanation = '';
    
    const lines = block.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.startsWith('Q:') || trimmed.startsWith('Câu hỏi:')) {
        questionText = trimmed.replace(/^(Q:|Câu hỏi:)\s*/, '').trim();
        // Strip leading question number: "1. Question" → "Question"
        questionText = questionText.replace(/^\d+[\.\)\s]+\s*/, '');
      } else if (trimmed.match(/^[A-D][.:)]\s*/i)) {
        options.push(trimmed);
      } else if (/^(ANS|K|Đáp án|Key|Answer|Correct):/i.test(trimmed)) {
        const val = trimmed.replace(/^(ANS|K|Đáp án|Key|Answer|Correct):\s*/i, '').trim();
        if (val) {
          correctAnswer = val.toUpperCase().charAt(0);
        }
      } else if (/^(EXP|E|Giải thích|Explain|Explanation):/i.test(trimmed)) {
        explanation = trimmed.replace(/^(EXP|E|Giải thích|Explain|Explanation):\s*/i, '').trim();
      }
      // S: / AI: lines are intentionally ignored (isSolvedByAi removed from prompt)
    });
    
    // Allow import even without correct answer — mark as "?" so user can fix later
    if (questionText && options.length >= 2) {
      questions.push({
        id: `q_txt_${Date.now()}_${index}`,
        question: questionText,
        options,
        correctAnswer: correctAnswer || '?',
        explanation: explanation || undefined,
        isSolvedByAi: false
      });
    }
  });
  
  if (questions.length === 0) {
    throw new Error('No questions found in custom format');
  }
  return questions;
};

function App() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'flashcard' | 'quiz' | 'review' | 'mock-test-dashboard' | 'mock-test-play' | 'mock-test-results'>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'pink-dark' | 'pink-light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mockTestHistory, setMockTestHistory] = useState<MockTestHistoryItem[]>([]);
  const [activeMockTestConfig, setActiveMockTestConfig] = useState<MockTestConfig | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<MockTestHistoryItem | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load decks, theme, and test history on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setDecks(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved decks:', e);
      }
    }

    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'pink-dark' | 'pink-light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const savedHistory = localStorage.getItem('quizmaster_mock_history');
    if (savedHistory) {
      try {
        setMockTestHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing mock test history:', e);
      }
    }
  }, []);

  const handleThemeChange = (nextTheme: 'dark' | 'light' | 'pink-dark' | 'pink-light') => {
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const saveDecks = (updatedDecks: Deck[]) => {
    setDecks(updatedDecks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDecks));
  };

  // Mock Test Handlers
  const handleStartTest = (config: MockTestConfig) => {
    setActiveMockTestConfig(config);
    setViewingHistoryItem(null);
    setCurrentView('mock-test-play');
  };

  const handleSaveMockResult = (result: Omit<MockTestHistoryItem, 'id' | 'date'>) => {
    const newItem: MockTestHistoryItem = {
      ...result,
      id: `mock_history_${Date.now()}`,
      date: Date.now(),
    };
    const updatedHistory = [newItem, ...mockTestHistory];
    setMockTestHistory(updatedHistory);
    localStorage.setItem('quizmaster_mock_history', JSON.stringify(updatedHistory));
  };

  const handleDeleteMockHistory = (id: string) => {
    const updatedHistory = mockTestHistory.filter(h => h.id !== id);
    setMockTestHistory(updatedHistory);
    localStorage.setItem('quizmaster_mock_history', JSON.stringify(updatedHistory));
    if (viewingHistoryItem?.id === id) {
      setViewingHistoryItem(null);
      setCurrentView('mock-test-dashboard');
    }
  };

  const handleViewHistoryItem = (item: MockTestHistoryItem) => {
    setViewingHistoryItem(item);
    setCurrentView('mock-test-results');
  };

  const handleImportDeck = (name: string, jsonString: string, appendToDeckId?: string): boolean => {
    try {
      let cleanedJson = jsonString.trim();
      let validatedQuestions: Question[] = [];

      const isJsonFormat = cleanedJson.startsWith('[') || 
                           cleanedJson.startsWith('{') || 
                           (cleanedJson.startsWith('```') && (cleanedJson.includes('json') || cleanedJson.includes('[')));

      if (isJsonFormat) {
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/```$/, '');
        }
        cleanedJson = cleanedJson.trim();

        const parsed = JSON.parse(cleanedJson);

        if (!Array.isArray(parsed)) return false;

        validatedQuestions = parsed.map((item: any, index: number) => {
          if (!item.question || !Array.isArray(item.options) || item.options.length < 2 || !item.correctAnswer) {
            throw new Error('Invalid question structure');
          }

          let corrAns = String(item.correctAnswer).trim().toUpperCase().charAt(0);
          
          return {
            id: item.id || `q_${Date.now()}_${index}`,
            question: String(item.question),
            options: item.options.map((opt: any) => String(opt)),
            correctAnswer: corrAns,
            explanation: item.explanation ? String(item.explanation) : undefined,
            isSolvedByAi: !!item.isSolvedByAi
          };
        });
      } else {
        // Parse custom ultra-compact text format
        validatedQuestions = parseCustomFormat(jsonString);
      }

      if (appendToDeckId) {
        const updatedDecks = decks.map(d => {
          if (d.id === appendToDeckId) {
            const existingIds = d.questions.map(q => q.id);
            const nonDuplicateNewQuestions = validatedQuestions.map((q, idx) => {
              if (existingIds.includes(q.id)) {
                return { ...q, id: `${q.id}_dup_${Date.now()}_${idx}` };
              }
              return q;
            });
            return {
              ...d,
              questions: [...d.questions, ...nonDuplicateNewQuestions]
            };
          }
          return d;
        });
        saveDecks(updatedDecks);
        setCurrentView('dashboard');
        return true;
      }

      const newDeck: Deck = {
        id: `deck_${Date.now()}`,
        name,
        questions: validatedQuestions,
        createdAt: Date.now(),
        progress: {
          correctQuestions: [],
          wrongQuestions: [],
          starredQuestions: []
        }
      };

      const updatedDecks = [newDeck, ...decks];
      saveDecks(updatedDecks);
      setCurrentView('dashboard');
      return true;
    } catch (err) {
      console.error('Failed to import deck:', err);
      return false;
    }
  };

  const handleSaveProgress = (
    deckId: string, 
    correctIds: string[], 
    wrongIds: string[], 
    starredIds: string[]
  ) => {
    const updatedDecks = decks.map(d => {
      if (d.id === deckId) {
        return {
          ...d,
          progress: {
            correctQuestions: correctIds,
            wrongQuestions: wrongIds,
            starredQuestions: starredIds
          }
        };
      }
      return d;
    });
    saveDecks(updatedDecks);
  };

  const handleDeleteDeck = (deckId: string) => {
    const updatedDecks = decks.filter(d => d.id !== deckId);
    saveDecks(updatedDecks);
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null);
      setCurrentView('dashboard');
    }
  };

  const handleSelectDeck = (deckId: string, mode: 'flashcard' | 'quiz' | 'review') => {
    setSelectedDeckId(deckId);
    setCurrentView(mode);
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  // Render active view
  const renderView = () => {
    switch (currentView) {
      case 'import':
        return (
          <ImportDeck 
            decks={decks}
            onImport={handleImportDeck} 
            onCancel={() => setCurrentView('dashboard')} 
          />
        );
      case 'flashcard':
        if (!selectedDeck) return null;
        return (
          <FlashcardView 
            deck={selectedDeck} 
            onSaveProgress={handleSaveProgress}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'quiz':
        if (!selectedDeck) return null;
        return (
          <QuizView 
            deck={selectedDeck} 
            onSaveProgress={handleSaveProgress}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'review':
        if (!selectedDeck) return null;
        return (
          <ReviewView 
            deck={selectedDeck} 
            onSaveProgress={handleSaveProgress}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'mock-test-dashboard':
        return (
          <MockTestDashboard 
            decks={decks}
            onStartTest={handleStartTest}
            history={mockTestHistory}
            onDeleteHistoryItem={handleDeleteMockHistory}
            onViewHistoryItem={handleViewHistoryItem}
          />
        );
      case 'mock-test-play':
        return (
          <MockTestPlay 
            config={activeMockTestConfig!}
            decks={decks}
            onSaveResult={handleSaveMockResult}
            onBack={() => setCurrentView('mock-test-dashboard')}
          />
        );
      case 'mock-test-results':
        return (
          <MockTestPlay 
            decks={decks}
            onBack={() => setCurrentView('mock-test-dashboard')}
            reviewItem={viewingHistoryItem!}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard 
            decks={decks} 
            onSelectDeck={handleSelectDeck}
            onDeleteDeck={handleDeleteDeck}
            onGoImport={() => setCurrentView('import')}
          />
        );
    }
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        deckCount={decks.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="main-content">
        <Header 
          onGoHome={() => setCurrentView('dashboard')} 
          onGoImport={() => setCurrentView('import')}
          deckCount={decks.length}
          theme={theme}
          onChangeTheme={handleThemeChange}
          onOpenSidebar={() => setSidebarOpen(true)}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
