import { useState, useEffect } from 'react';
import type { Deck, Question } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ImportDeck } from './components/ImportDeck';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { ReviewView } from './components/ReviewView';

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
    let isSolvedByAi = false;
    
    const lines = block.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.startsWith('Q:') || trimmed.startsWith('Câu hỏi:')) {
        questionText = trimmed.replace(/^(Q:|Câu hỏi:)\s*/, '').trim();
      } else if (trimmed.match(/^[A-D][.:)]\s*/i)) {
        options.push(trimmed);
      } else if (trimmed.startsWith('K:') || trimmed.startsWith('Đáp án:') || trimmed.startsWith('Key:')) {
        correctAnswer = trimmed.replace(/^(K:|Đáp án:|Key:)\s*/, '').trim().toUpperCase().charAt(0);
      } else if (trimmed.startsWith('E:') || trimmed.startsWith('Giải thích:')) {
        explanation = trimmed.replace(/^(E:|Giải thích:)\s*/, '').trim();
      } else if (trimmed.startsWith('S:') || trimmed.startsWith('AI:')) {
        const val = trimmed.replace(/^(S:|AI:)\s*/, '').trim().toLowerCase();
        isSolvedByAi = val === 'true' || val === 'yes' || val === '1';
      }
    });
    
    if (questionText && options.length >= 2 && correctAnswer) {
      questions.push({
        id: `q_txt_${Date.now()}_${index}`,
        question: questionText,
        options,
        correctAnswer,
        explanation: explanation || undefined,
        isSolvedByAi
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'import' | 'flashcard' | 'quiz' | 'review'>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Load decks on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setDecks(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved decks:', e);
      }
    }
  }, []);

  const saveDecks = (updatedDecks: Deck[]) => {
    setDecks(updatedDecks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDecks));
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
    <div className="app-layout">
      <Header 
        onGoHome={() => setCurrentView('dashboard')} 
        onGoImport={() => setCurrentView('import')}
        deckCount={decks.length}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
