import { useGameEngine } from './hooks/useGameEngine';
import Layout from './components/Layout';
import MainMenu from './pages/MainMenu';
import QuizBuilder from './pages/QuizBuilder';
import GameSetup from './pages/GameSetup';
import Lobby from './pages/Lobby';
import GamePlay from './pages/GamePlay';
import Results from './pages/Results';
import QuestionBank from './pages/QuestionBank';

function App() {
  const game = useGameEngine();

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
          />
        );
      case 'game-setup':
        return (
          <GameSetup
            config={game.config}
            updateConfig={game.updateConfig}
            onBack={() => game.navigateTo('main-menu')}
            onStart={() => game.startGame()}
          />
        );
      case 'lobby':
        return (
          <Lobby
            players={game.config.players}
            updatePlayer={game.updatePlayer}
            onStart={game.startGameplay}
            onBack={() => game.navigateTo('quiz-builder')}
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
          />
        );
      case 'question-bank':
        return <QuestionBank onBack={() => game.navigateTo('main-menu')} />;
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
