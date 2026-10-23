import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, FileJson, Check, AlertCircle } from 'lucide-react';
import type { Question } from '../types';

interface ImportQuestionsProps {
  onBack: () => void;
  onImportComplete: (questions: Question[]) => void;
}

export default function ImportQuestions({ onBack, onImportComplete }: ImportQuestionsProps) {
  const [dragOver, setDragOver] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateQuestion = (q: any): q is Question => {
    return (
      typeof q.id === 'string' &&
      typeof q.text === 'string' &&
      typeof q.type === 'string' &&
      ['multiple_choice', 'buzzer', 'true_false'].includes(q.type) &&
      typeof q.difficulty === 'string' &&
      ['lett', 'middels', 'vanskelig'].includes(q.difficulty) &&
      Array.isArray(q.categories) &&
      Array.isArray(q.choices) &&
      Array.isArray(q.correctChoiceIds)
    );
  };

  const parseFile = async (file: File) => {
    setError(null);
    setSuccess(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const questions: Question[] = Array.isArray(data) ? data : data.questions || [];
      const validQuestions = questions.filter(validateQuestion);

      if (validQuestions.length === 0) {
        setError('Ingen gyldige spørsmål funnet i filen');
        return;
      }

      setImportedQuestions(validQuestions);
      setSuccess(true);
    } catch (err) {
      setError('Kunne ikke parse filen. Sjekk at den er gyldig JSON.');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      parseFile(file);
    } else {
      setError('Kun JSON-filer støttes');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleSaveToGame = () => {
    if (importedQuestions.length > 0) {
      // Lagre i localStorage for senere bruk
      const existing = JSON.parse(localStorage.getItem('quizkrets_imported_questions') || '[]');
      localStorage.setItem('quizkrets_imported_questions', JSON.stringify([...existing, ...importedQuestions]));
      
      onImportComplete(importedQuestions);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        id: "example-1",
        text: "Hva er hovedstaden i Norge?",
        type: "multiple_choice",
        difficulty: "lett",
        categories: ["geografi"],
        choices: [
          { id: "a", text: "Oslo" },
          { id: "b", text: "Bergen" },
          { id: "c", text: "Trondheim" },
          { id: "d", text: "Stavanger" }
        ],
        correctChoiceIds: ["a"]
      }
    ];
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quizkrets-mal.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-secondary p-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="tv-heading text-primary">Importer spørsmål</h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Drop zone */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card min-h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-dashed border-2 border-border'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mb-4 transition-colors ${dragOver ? 'text-primary' : 'text-text-muted'}`} />
          <p className="text-text-secondary text-lg text-center">
            {dragOver ? 'Slipp filen her' : 'Dra og slipp en JSON-fil, eller klikk for å velge'}
          </p>
          <p className="text-text-muted text-sm mt-2">Kun JSON-filer støttes</p>
        </motion.div>

        {/* Feilmelding */}
        {error && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card border-error flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-error" />
            <span className="text-error">{error}</span>
          </motion.div>
        )}

        {/* Suksessmelding */}
        {success && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card border-success flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-success" />
            <span className="text-success">
              {importedQuestions.length} spørsmål importert!
            </span>
          </motion.div>
        )}

        {/* Preview av importerte spørsmål */}
        {importedQuestions.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-3"
          >
            <h2 className="font-display text-xl text-text-primary">Forhåndsvisning</h2>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {importedQuestions.slice(0, 5).map((q, i) => (
                <div key={i} className="card p-3">
                  <p className="text-text-primary font-medium">{q.text}</p>
                  <div className="flex gap-2 mt-2 text-xs text-text-secondary">
                    <span className="capitalize">{q.difficulty}</span>
                    <span>•</span>
                    <span>{q.categories.join(', ')}</span>
                    <span>•</span>
                    <span>{q.choices.length} alternativer</span>
                  </div>
                </div>
              ))}
              {importedQuestions.length > 5 && (
                <p className="text-text-muted text-sm text-center">
                  ... og {importedQuestions.length - 5} til
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={handleSaveToGame} className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Lagre og bruk
              </button>
            </div>
          </motion.div>
        )}

        {/* Mal-nedlasting */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="font-display text-xl text-text-primary mb-4">Mal for import</h2>
          <p className="text-text-secondary mb-4">
            Last ned en mal for å se riktig format for spørsmålsimportering.
          </p>
          <button 
            onClick={handleDownloadTemplate}
            className="btn-secondary flex items-center gap-2"
          >
            <FileJson className="w-5 h-5" />
            Last ned JSON-mal
          </button>
          <div className="mt-4 p-4 bg-bg-elevated rounded-xl">
            <p className="text-text-muted text-sm mb-2">Format-krav:</p>
            <ul className="text-text-muted text-sm space-y-1 list-disc list-inside">
              <li>Spørsmål må være i et JSON-array</li>
              <li>Hvert objekt må ha: id, text, type, difficulty, categories, choices, correctChoiceIds</li>
              <li>type: "multiple_choice", "buzzer", eller "true_false"</li>
              <li>difficulty: "lett", "middels", eller "vanskelig"</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
