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
import type { QuizPreset, Difficulty } from './types';
import type { GameConfig } from './hooks/useGameEngine';

function App() {
  const game = useGameEngine();

  const handleLoadPreset = (preset: QuizPreset) => {
    const round = preset.rounds[0];
    // configUpdates sikrer at uttrekket bruker preset-verdiene umiddelbart.
    game.startGame({
      configUpdates: {
        quizName: preset.name,
        selectedCategories: preset.categories,
        selectedDifficulties: preset.difficulties,
        questionCount: preset.questionCount,
        gameMode: round?.mode ?? 'classic',
        timePerQuestion: round?.timeLimit ?? 20,
        pointsPerCorrect: round?.pointsPerCorrect ?? 100,
        pointsPerWrong: round?.pointsPerWrong ?? 0,
        bonusForSpeed: round?.bonusForSpeed ?? false,
      },
    });
  };

  const currentQuestion = game.questions[game.currentQuestionIndex];

  const renderScreen = () => {
    switch (game.screen) {
      case 'main-menu':
        return <MainMenu onNavigate={game.navigateTo} />;
      case 'quiz-builder':
        return (
          <QuizBuilder
            config={game.config}
            updateConfig={game.updateConfig}
            getAvailability={game.getAvailability}
            selectionError={game.selectionError}
            onDismissSelectionError={game.clearSelectionError}
            onStartWithReuse={() => game.startGame({ allowReuse: true })}
            onFetchMore={() => game.navigateTo('fetch-from-api')}
            onBack={() => game.navigateTo('main-menu')}
            onStart={(configUpdates?: Partial<GameConfig>) =>
              game.startGame(configUpdates ? { configUpdates } : undefined)
            }
            onSaveQuiz={() => {
              const preset: QuizPreset = {
                id: `custom-${Date.now()}`,
                name: game.config.quizName || `Quiz ${new Date().toLocaleDateString('no-NO')}`,
                categories: game.config.selectedCategories,
                difficulties: game.config.selectedDifficulties as Difficulty[],
                questionCount: game.config.questionCount,
                categoryWeights: {},
                rounds: [
                  {
                    mode: game.config.gameMode,
                    questionCount: game.config.questionCount,
                    timeLimit: game.config.timePerQuestion,
                    pointsPerCorrect: game.config.pointsPerCorrect,
                    pointsPerWrong: game.config.pointsPerWrong,
                    bonusForSpeed: game.config.bonusForSpeed,
                  },
                ],
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
            getAvailability={game.getAvailability}
            selectionError={game.selectionError}
            onDismissSelectionError={game.clearSelectionError}
            onStartWithReuse={() => game.startGame({ allowReuse: true })}
            onBack={() => game.navigateTo('main-menu')}
            onStart={(configUpdates) => {
              game.startGame({ configUpdates });
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
            question={currentQuestion}
            currentQuestionIndex={game.currentQuestionIndex}
            totalQuestions={game.questions.length}
            players={game.config.players}
            scores={game.scores}
            gameMode={game.gameMode}
            timePerQuestion={game.timePerQuestion}
            onAnswer={game.registerAnswer}
            onTimeout={() => game.finishCurrentQuestion(true)}
            onNextQuestion={game.nextQuestion}
            onQuit={game.resetGame}
            questionAnswers={currentQuestion ? game.getQuestionAnswers(currentQuestion.id) : []}
          />
        );
      case 'results':
        return (
          <Results
            rankedPlayers={game.rankedPlayers}
            teamResults={game.teamResults}
            questions={game.questions}
            answers={game.getAnswers()}
            quizName={game.config.quizName}
            durationMs={game.getDurationMs()}
            onPlayAgain={() => game.playAgain()}
            onMainMenu={game.resetGame}
            onBackToLobby={game.backToLobby}
          />
        );
      case 'question-bank':
        return <QuestionBank onBack={() => game.navigateTo('main-menu')} />;
      case 'question-sources':
        return <QuestionSources onBack={() => game.navigateTo('main-menu')} />;
      case 'fetch-from-api':
        return (
          <FetchFromAPI
            onBack={() => game.navigateTo('game-setup')}
            onImportComplete={() => game.navigateTo('question-bank')}
          />
        );
      default:
        return <MainMenu onNavigate={game.navigateTo} />;
    }
  };

  return <Layout>{renderScreen()}</Layout>;
}

export default App;
