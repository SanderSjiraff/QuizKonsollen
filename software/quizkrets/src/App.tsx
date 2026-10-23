import { useGameEngine } from './hooks/useGameEngine';
import Layout from './components/Layout';
import MainMenu from './pages/MainMenu';
import QuizBuilder from './pages/QuizBuilder';
import SavedQuizzes from './pages/SavedQuizzes';
import GameSetup from './pages/GameSetup';
import Lobby from './pages/Lobby';
import GamePlay from './pages/GamePlay';
import Results from './pages/Results';
import QuestionBank from './pages/QuestionBank';
import Scoreboard from './pages/Scoreboard';
import ImportQuestions from './pages/ImportQuestions';
import FetchFromAPI from './pages/FetchFromAPI';
import QuestionSources from './pages/QuestionSources';
import { saveQuizPreset } from './data/savedQuizzes';
import type { Question } from './types';

function App() {
  const game = useGameEngine();

  const handleLoadPreset = (preset: { id: string; name: string; categories: string[]; difficulties: string[]; questionCount: number; categoryWeights: Record<string, number>; rounds: { mode: string; questionCount: number; timeLimit: number; pointsPerCorrect: number; pointsPerWrong: number; bonusForSpeed?: boolean }[] }) => {
    // Update config with preset values
    game.updateConfig({
      selectedCategories: preset.categories,
      selectedDifficulties: preset.difficulties as ('lett' | 'middels' | 'vanskelig')[],
      questionCount: preset.questionCount,
      gameMode: preset.rounds[0].mode as ('classic' | 'buzzer' | 'team'),
      timePerQuestion: preset.rounds[0].timeLimit,
    });
    // Navigate to lobby
    game.startGame();
  };

  const renderScreen = () => {
    switch (game.screen) {
      case 'main-menu':
        return <MainMenu onNavigate={game.navigateTo} />;
      case 'quiz-builder':
        return (
          <QuizBuilder
            config={game.config}
            updateConfig={game.updateConfig}
            onBack={() => game.navigateTo('main-menu')}
            onStart={() => game.startGame()}
            onSaveQuiz={() => {
              // Save current config as a preset
              const preset: import('./types').QuizPreset = {
                id: `custom-${Date.now()}`,
                name: `Quiz ${new Date().toLocaleDateString('no-NO')}`,
                categories: game.config.selectedCategories,
                difficulties: game.config.selectedDifficulties as ('lett' | 'middels' | 'vanskelig')[],
                questionCount: game.config.questionCount,
                categoryWeights: {},
                rounds: [{
                  mode: game.config.gameMode,
                  questionCount: game.config.questionCount,
                  timeLimit: game.config.timePerQuestion,
                  pointsPerCorrect: 100,
                  pointsPerWrong: 0,
                }],
              };
              saveQuizPreset(preset);
            }}
          />
        );
      case 'saved-quizzes':
        return (
          <SavedQuizzes
            onBack={() => game.navigateTo('main-menu')}
            onSelectQuiz={handleLoadPreset}
            onCreateQuiz={() => game.navigateTo('quiz-builder')}
          />
        );
      case 'game-setup':
        return (
          <GameSetup
            config={game.config}
            updateConfig={game.updateConfig}
            onBack={() => game.navigateTo('main-menu')}
            onStart={(questions: Question[]) => {
              game.startGame(questions);
            }}
            onScoreboard={() => game.navigateTo('scoreboard')}
            onImportQuestions={() => game.navigateTo('fetch-from-api')}
          />
        );
      case 'scoreboard':
        return <Scoreboard onBack={() => game.navigateTo('game-setup')} />;
      case 'import-questions':
        return (
          <ImportQuestions
            onBack={() => game.navigateTo('game-setup')}
            onImportComplete={() => game.navigateTo('game-setup')}
          />
        );
      case 'lobby':
        return (
          <Lobby
            players={game.config.players}
            updatePlayer={game.updatePlayer}
            onStart={game.startGameplay}
            onBack={() => game.navigateTo('game-setup')}
          />
        );
      case 'game-play':
        return (
          <GamePlay
            question={game.questions[game.currentQuestionIndex]}
            currentQuestionIndex={game.currentQuestionIndex}
            totalQuestions={game.questions.length}
            players={game.config.players}
            scores={game.scores}
            gameMode={game.gameMode}
            onAnswer={game.answerQuestion}
            onNextQuestion={game.nextQuestion}
            onQuit={game.resetGame}
          />
        );
      case 'results':
        return (
          <Results
            players={game.config.players}
            scores={game.scores}
            onPlayAgain={game.playAgain}
            onMainMenu={game.resetGame}
            onBackToLobby={game.backToLobby}
          />
        );
      case 'question-bank':
        return <QuestionBank onBack={() => game.navigateTo('main-menu')} />;
      case 'question-sources':
        return <QuestionSources onBack={() => game.navigateTo('main-menu')} />;
      case 'fetch-from-api':
        return <FetchFromAPI onBack={() => game.navigateTo('game-setup')} onImportComplete={(questions) => {
          // Legg til i spørsmålsbanken
          const existing = JSON.parse(localStorage.getItem('quizkrets_imported_questions') || '[]');
          localStorage.setItem('quizkrets_imported_questions', JSON.stringify([...existing, ...questions]));
          game.navigateTo('question-bank');
        }} />;
      default:
        return <MainMenu onNavigate={game.navigateTo} />;
    }
  };

  return (
    <Layout>
      {renderScreen()}
    </Layout>
  );
}

export default App;
