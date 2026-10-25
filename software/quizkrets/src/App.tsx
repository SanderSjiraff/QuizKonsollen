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
import { saveQuizPreset, presetToConfigUpdates } from './data/savedQuizzes';
import type { QuizPreset, Difficulty } from './types';
import type { GameConfig } from './hooks/useGameEngine';

function App() {
  const game = useGameEngine();

  const handleLoadPreset = (preset: QuizPreset) => {
    // configUpdates sikrer at uttrekket bruker preset-verdiene umiddelbart,
    // inkludert lagrede kategorivekter (presetToConfigUpdates oppgir dem
    // alltid eksplisitt, slik at gamle vekter nullstilles).
    game.startGame({ configUpdates: presetToConfigUpdates(preset) });
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
                // Lagre faktiske vekter fra quizbyggeren (ikke tomt objekt)
                categoryWeights: game.config.categoryWeights ?? {},
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
                customTheme: game.config.customTheme,
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
            selectionError={game.selectionError}
            categories={game.config.selectedCategories}
            difficulties={game.config.selectedDifficulties}
            onDismissSelectionError={game.clearSelectionError}
            onReduceCount={newCount =>
              game.startGame({ configUpdates: { questionCount: newCount } })
            }
            onStartWithReuse={() => game.startGame({ allowReuse: true })}
            onFetchMore={() => game.navigateTo('fetch-from-api')}
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
            onImportFile={() => game.navigateTo('import-questions')}
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
            onPause={game.pauseGame}
            onResume={game.resumeGame}
            questionAnswers={currentQuestion ? game.getQuestionAnswers(currentQuestion.id) : []}
            selectedCategories={game.config.selectedCategories}
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
