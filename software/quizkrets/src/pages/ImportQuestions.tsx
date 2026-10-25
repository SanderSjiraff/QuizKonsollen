import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Upload, FileJson, FileText, CheckCircle2, AlertCircle,
  Download, Trash2,
} from 'lucide-react';
import type { Question } from '../types';
import { addQuestions, normalizeText, StorageError } from '../data/questionStore';
import { validateQuestionDraft, type ValidationIssue } from '../core/questionValidation';
import { parseCsv, csvToDrafts } from '../core/csvImport';

interface ImportQuestionsProps {
  onBack: () => void;
  onImportComplete: () => void;
}

interface ParsedQuestion {
  raw: unknown;
  preview: Question;
  issues: ValidationIssue[];
}

const TEMPLATE_JSON = `[
  {
    "text": "Hva er hovedstaden i Norge?",
    "type": "multiple_choice",
    "difficulty": "lett",
    "categories": ["geografi", "norge"],
    "choices": [
      { "id": "a", "text": "Oslo" },
      { "id": "b", "text": "Bergen" },
      { "id": "c", "text": "Trondheim" },
      { "id": "d", "text": "Stavanger" }
    ],
    "correctChoiceIds": ["a"],
    "explanation": "Oslo har vært hovedstad siden 1814."
  }
]`;

const TEMPLATE_CSV = `text;type;difficulty;categories;correct;choice_a;choice_b;choice_c;choice_d;explanation
Hva er hovedstaden i Norge?;multiple_choice;lett;geografi|norge;a;Oslo;Bergen;Trondheim;Stavanger;Oslo har vært hovedstad siden 1814.
Norge er en monarki;true_false;lett;samfunn-og-kultur|politikk;a;Sant;Usant;;;`;

/** Legg til ID og normaliser vanskelighet/type fra friere JSON-format. */
function normalizeDraft(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    difficulty: mapDifficulty(o.difficulty),
    type: mapType(o.type),
    categories: Array.isArray(o.categories) ? o.categories : [o.category].filter(Boolean),
    choices: Array.isArray(o.choices)
      ? o.choices
      : Array.isArray(o.answers)
        ? o.answers
        : o.choices,
  };
}

function mapDifficulty(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const v = value.trim().toLowerCase();
  if (v === 'easy' || v === 'lett') return 'lett';
  if (v === 'medium' || v === 'middels' || v === 'moderat') return 'middels';
  if (v === 'hard' || v === 'vanskelig') return 'vanskelig';
  return value;
}

function mapType(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const v = value.trim().toLowerCase();
  if (v === 'multiple' || v === 'mc' || v === 'multiple_choice') return 'multiple_choice';
  if (v === 'boolean' || v === 'tf' || v === 'true_false') return 'true_false';
  return value;
}

export default function ImportQuestions({ onBack, onImportComplete }: ImportQuestionsProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [valid, setValid] = useState<ParsedQuestion[]>([]);
  const [invalid, setInvalid] = useState<{ preview: string; issues: string[] }[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    setImported(null);
    setValid([]);
    setInvalid([]);
    setDuplicates([]);
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);

    try {
      const content = await file.text();
      let rawQuestions: unknown[] = [];
      // P1 #9: CSV-rader med ugyldig fasit forkaster ikke lenger hele
      // importen – de samles radvis og vises i «avvist»-listen.
      let csvInvalid: { preview: string; issues: string[] }[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const result = csvToDrafts(parseCsv(content));
        rawQuestions = result.drafts;
        csvInvalid = result.invalid;
      } else {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          rawQuestions = parsed;
        } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown[] }).questions)) {
          rawQuestions = (parsed as { questions: unknown[] }).questions;
        } else {
          setError('JSON-filen må inneholde en array med spørsmål (eller et objekt med "questions"-array).');
          return;
        }
      }

      if (rawQuestions.length === 0 && csvInvalid.length === 0) {
        setError('Ingen spørsmål funnet i filen.');
        return;
      }

      // Valider hvert spørsmål og skill gyldige/ugyldige/duplikater
      const newValid: ParsedQuestion[] = [];
      const newInvalid: { preview: string; issues: string[] }[] = [];
      const newDuplicates: string[] = [];
      const seenTexts = new Set<string>();

      rawQuestions.forEach((raw, i) => {
        const normalized = normalizeDraft(raw);
        const validation = validateQuestionDraft(normalized);
        const previewText =
          typeof (normalized as { text?: unknown }).text === 'string'
            ? (normalized as { text: string }).text
            : `Spørsmål ${i + 1}`;

        if (!validation.valid) {
          newInvalid.push({
            preview: previewText,
            issues: [...new Set(validation.errors.map(e => e.message))],
          });
          return;
        }

        const q = normalized as unknown as Question;
        const textKey = normalizeText(q.text);
        if (seenTexts.has(textKey)) {
          newDuplicates.push(q.text);
          return;
        }
        seenTexts.add(textKey);
        newValid.push({ raw: normalized, preview: q, issues: [] });
      });

      // CSV-rader med ugyldig fasit vises i samme «avvist»-liste som
      // ugyldige JSON-spørsmål.
      newInvalid.unshift(...csvInvalid);

      setValid(newValid);
      setInvalid(newInvalid);
      setDuplicates(newDuplicates);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Kunne ikke lese filen: ${err.message}`
          : 'Ukjent feil ved lesing av filen.'
      );
    }
  };

  const downloadTemplate = (format: 'json' | 'csv') => {
    const blob = new Blob([format === 'json' ? TEMPLATE_JSON : TEMPLATE_CSV], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quizkrets-mal.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (valid.length === 0) return;
    try {
      // Duplikater mot eksisterende bank avvises av addQuestions
      const result = addQuestions(
        valid.map(v => v.preview),
        'import',
        fileName ?? 'Filimport'
      );
      setImported(result.added);
      setValid([]);
      setInvalid([]);
      setDuplicates([]);
      if (result.duplicates > 0) {
        setDuplicates(
          result.rejectedQuestions.map(q => q.text)
        );
      }
      onImportComplete();
    } catch (error) {
      // Lagringsfeil: banken er uendret. Vis meldingen med eksport-hint.
      setError(
        error instanceof StorageError
          ? error.message
          : 'Uventet feil ved import. Eksisterende spørsmål er uendret.'
      );
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="tv-heading text-primary">Importer spørsmål</h1>
          <p className="text-text-secondary">Last inn spørsmål fra JSON- eller CSV-fil</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Maler */}
        <div className="card p-5">
          <h2 className="font-semibold text-text-primary mb-3">Last ned mal</h2>
          <div className="flex gap-3">
            <button onClick={() => downloadTemplate('json')} className="btn-secondary flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              JSON-mal
            </button>
            <button onClick={() => downloadTemplate('csv')} className="btn-secondary flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CSV-mal
            </button>
          </div>
          <p className="text-text-muted text-sm mt-3">
            CSV bruker semikolon som skilletegn. Kategorier skilles med |. Feltene
            «text;type;difficulty;categories;correct;choice_a;choice_b;choice_c;choice_d;explanation» støttes.
          </p>
        </div>

        {/* Sone for dra og slipp */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`card cursor-pointer transition-all p-10 text-center border-2 border-dashed ${
            dragOver ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          role="button"
          aria-label="Last opp fil med spørsmål"
        >
          <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
          <p className="text-text-primary text-xl font-semibold">
            Dra filen hit, eller klikk for å velge
          </p>
          <p className="text-text-muted mt-2">Støtter .json og .csv</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>

        {/* Feil */}
        {error && (
          <div className="card border-error flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <span className="text-error">{error}</span>
          </div>
        )}

        {/* Importert */}
        {imported !== null && (
          <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card border-success">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <span className="text-success text-lg font-semibold">
                {imported} spørsmål importert til spørsmålsbanken!
              </span>
            </div>
          </motion.div>
        )}

        {/* Oppsummering før import */}
        <AnimatePresence>
          {valid.length + invalid.length + duplicates.length > 0 && imported === null && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-6">
              <h2 className="font-display text-xl text-text-primary mb-4">Oppsummering</h2>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-4 bg-success/10 rounded-xl">
                  <div className="font-display text-3xl text-success">{valid.length}</div>
                  <div className="text-text-secondary text-sm">gyldige</div>
                </div>
                <div className="text-center p-4 bg-error/10 rounded-xl">
                  <div className="font-display text-3xl text-error">{invalid.length}</div>
                  <div className="text-text-secondary text-sm">avvist</div>
                </div>
                <div className="text-center p-4 bg-bg-elevated rounded-xl">
                  <div className="font-display text-3xl text-text-muted">{duplicates.length}</div>
                  <div className="text-text-secondary text-sm">duplikater</div>
                </div>
              </div>

              {invalid.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-error mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Avviste spørsmål (hvorfor):
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {invalid.map((item, i) => (
                      <div key={i} className="p-3 bg-error/5 rounded-lg border border-error/20">
                        <p className="text-text-primary font-medium truncate">{item.preview || '(mangler tekst)'}</p>
                        <ul className="text-error text-sm mt-1 list-disc list-inside">
                          {item.issues.map(issue => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-text-muted mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Duplikater i filen (hoppes over):
                  </h3>
                  <ul className="text-text-muted text-sm list-disc list-inside max-h-32 overflow-y-auto">
                    {duplicates.map((text, i) => (
                      <li key={i} className="truncate">{text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {valid.length > 0 && (
                <button
                  onClick={handleImport}
                  className="btn-primary w-full py-4 text-xl flex items-center justify-center gap-2"
                >
                  <Download className="w-6 h-6" />
                  Importer {valid.length} spørsmål
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
