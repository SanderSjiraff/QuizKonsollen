import { motion } from 'framer-motion';
import { Play, Wrench, Settings, BookOpen, Trophy } from 'lucide-react';
import type { Screen } from '../types';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

const menuItems = [
  { id: 'game-setup' as Screen, label: 'Start spill', icon: Play, description: 'Begynn en ny quiz', color: 'bg-primary' },
  { id: 'quiz-builder' as Screen, label: 'Bygg quiz', icon: Wrench, description: 'Lag din egen quiz', color: 'bg-info' },
  { id: 'question-bank' as Screen, label: 'Spørsmålsbank', icon: BookOpen, description: 'Behandle spørsmål', color: 'bg-success' },
  { id: 'main-menu' as Screen, label: 'Lagrede quizer', icon: Trophy, description: 'Dine lagrede quizer', color: 'bg-secondary' },
  { id: 'main-menu' as Screen, label: 'Innstillinger', icon: Settings, description: 'Systeminnstillinger', color: 'bg-player-7' },
];

export default function MainMenu({ onNavigate }: MainMenuProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / Tittel */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center mb-16"
      >
        <h1 className="font-display text-7xl md:text-8xl lg:text-9xl text-primary text-glow-primary mb-4">
          QuizKrets
        </h1>
        <p className="font-body text-xl md:text-2xl text-text-secondary">
          Det sosiale quizspillet for venner
        </p>
      </motion.div>

      {/* Meny-grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {menuItems.slice(0, 3).map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id + index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index + 0.3, duration: 0.5 }}
              onClick={() => onNavigate(item.id)}
              className="card-interactive group text-left p-8"
            >
              <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-8 h-8 text-bg-primary" />
              </div>
              <h3 className="font-display text-2xl text-text-primary mb-2">
                {item.label}
              </h3>
              <p className="text-text-secondary text-lg">
                {item.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Sekundær meny */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-4 mt-8"
      >
        {menuItems.slice(3).map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id + index}
              onClick={() => onNavigate(item.id)}
              className="btn-secondary flex items-center gap-3"
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
