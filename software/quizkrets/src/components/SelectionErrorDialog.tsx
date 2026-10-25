import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Globe, RefreshCw, Scissors, X } from 'lucide-react';
import type { SelectionError } from '../hooks/useGameEngine';
import { getCategoryName } from '../core/categories';
import type { Difficulty } from '../types';

interface SelectionErrorDialogProps {
  error: SelectionError;
  categories: string[];
  difficulties: Difficulty[] | string[];
  onReduceCount: (newCount: number) => void;
  onAllowReuse: () => void;
  onFetchMore: () => void;
  onDismiss: () => void;
}

const DIFFICULTY_NAMES: Record<string, string> = {
  lett: 'lette',
  middels: 'middels',
  vanskelig: 'vanskelige',
};

/**
 * Dialog som vises når valgene ikke kan oppfylles.
 * Krav: systemet skal ALDRI ignorere valgte kategorier/vanskelighetsgrader –
 * i stedet får brukeren tydelig beskjed og konkrete valg.
 */
export default function SelectionErrorDialog({
  error,
  categories,
  difficulties,
  onReduceCount,
  onAllowReuse,
  onFetchMore,
  onDismiss,
}: SelectionErrorDialogProps) {
  const catNames = categories.length > 0
    ? categories.map(getCategoryName).join(', ')
    : 'alle kategorier';
  const diffNames = difficulties.length > 0
    ? difficulties.map(d => DIFFICULTY_NAMES[d] ?? d).join(', ')
    : 'alle vanskelighetsgrader';

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-bg/90 z-50 flex items-center justify-center p-6"
          role="alertdialog"
          aria-modal="true"
          aria-label="Ikke nok spørsmål tilgjengelig"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="card border-error/50 max-w-2xl w-full p-8"
          >
            <div className="flex items-start gap-4 mb-5">
              <AlertTriangle className="w-12 h-12 text-error flex-shrink-0" />
              <div>
                <h3 className="font-display text-2xl text-error mb-2">Ikke nok spørsmål</h3>
                <p className="text-text-primary text-lg leading-relaxed">
                  Du har valgt <strong>{error.requested}</strong> spørsmål
                  {diffNames ? ` (${diffNames})` : ''}
                  {categories.length > 0 ? ` innenfor ${catNames}` : ''}, men det finnes bare{' '}
                  <strong>{error.available}</strong> ubrukte spørsmål som oppfyller valgene dine.
                </p>
                <p className="text-text-secondary mt-2">
                  Quizen starter ikke før antallet kan oppfylles – valgene dine ignoreres aldri.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {error.available > 0 && (
                <button
                  onClick={() => onReduceCount(error.available)}
                  className="btn-primary w-full py-4 flex items-center gap-3 text-lg"
                >
                  <Scissors className="w-5 h-5" />
                  Reduser antallet til {error.available} spørsmål
                </button>
              )}

              {/* P1 #8: gjenbruk tilbys KUN når gjenbruk faktisk kan dekke det
                  ønskede antallet – ellers ville knappen ført brukeren tilbake
                  til den samme dialogen i en løkke. */}
              {error.availableWithReuse >= error.requested && (
                <button
                  onClick={onAllowReuse}
                  className="btn-secondary w-full py-4 flex items-center gap-3 text-lg"
                >
                  <RefreshCw className="w-5 h-5" />
                  Tillat gjenbruk – {error.availableWithReuse} spørsmål tilgjengelig
                </button>
              )}

              <button
                onClick={onFetchMore}
                className="btn-secondary w-full py-4 flex items-center gap-3 text-lg"
              >
                <Globe className="w-5 h-5" />
                Hent flere spørsmål fra nettet
              </button>

              <button
                onClick={onDismiss}
                className="w-full py-3 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
                Avbryt – jeg endrer valgene mine
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
