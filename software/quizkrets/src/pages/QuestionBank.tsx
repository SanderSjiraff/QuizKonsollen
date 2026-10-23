import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { QUESTIONS, CATEGORIES } from '../data/mockData';

interface QuestionBankProps {
  onBack: () => void;
}

export default function QuestionBank({ onBack }: QuestionBankProps) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const filteredQuestions = QUESTIONS.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      q.categories.some(c => selectedCategories.includes(c));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-secondary p-3">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="tv-heading text-primary">Spørsmålsbank</h1>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nytt spørsmål
        </button>
      </div>

      {/* Søk og filtre */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Search className="w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Søk etter spørsmål..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-text-secondary mr-2" />
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-bg-primary'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Spørsmålsliste */}
      <div className="space-y-4">
        {filteredQuestions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="card group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {question.categories.map(catId => {
                    const cat = CATEGORIES.find(c => c.id === catId);
                    return (
                      <span
                        key={catId}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-bg-elevated text-text-secondary"
                      >
                        {cat?.name || catId}
                      </span>
                    );
                  })}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    question.difficulty === 'lett' ? 'bg-success/20 text-success' :
                    question.difficulty === 'middels' ? 'bg-warning/20 text-warning' :
                    'bg-error/20 text-error'
                  }`}>
                    {question.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                  {question.text}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {question.choices.map(choice => (
                    <div
                      key={choice.id}
                      className={`p-2 rounded-lg text-sm ${
                        question.correctChoiceIds.includes(choice.id)
                          ? 'bg-success/20 text-success border border-success/50'
                          : 'bg-bg-elevated text-text-secondary'
                      }`}
                    >
                      {String.fromCharCode(65 + question.choices.indexOf(choice))}. {choice.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => { /* TODO: edit question */ }}
                  className="p-2 rounded-lg bg-bg-elevated text-text-secondary hover:text-primary transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-bg-elevated text-text-secondary hover:text-error transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary text-xl">Ingen spørsmål funnet</p>
          <p className="text-text-muted mt-2">Prøv å endre søket eller filtrene</p>
        </div>
      )}
    </div>
  );
}
