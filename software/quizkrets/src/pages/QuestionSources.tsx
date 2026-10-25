import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BookOpen, Globe, Brain, Music, Film, Trophy, 
  FlaskConical, Palette, Cpu, Anchor  
} from 'lucide-react';

interface QuestionSourcesProps {
  onBack: () => void;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  sampleQuestions: string[];
  difficulty: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'geografi',
    name: 'Geografi',
    icon: Globe,
    description: 'Land, hovedsteder, natur, kontinenter',
    difficulty: 'Middels',
    sampleQuestions: [
      'Hva er hovedstaden i Australia?',
      'Hvilket land har flest innbyggere?',
      'Hva heter verdens lengste elv?',
      'Hvilken ørken er størst i verden?',
      'Hva er Nord-Amerikas høyeste fjell?',
    ],
  },
  {
    id: 'historie',
    name: 'Historie',
    icon: BookOpen,
    description: 'Krig, konger, oppdagelser, årstall',
    difficulty: 'Vanskelig',
    sampleQuestions: [
      'Hvilket år startet den andre verdenskrigen?',
      'Hvem oppdaget Amerika i 1492?',
      'Hva het den siste russiske tsaren?',
      'Hvilket land var Napoleon fra?',
      'Hva heter den gamle egyptiske skriftspråket?',
    ],
  },
  {
    id: 'vitenskap',
    name: 'Vitenskap',
    icon: FlaskConical,
    description: 'Fysikk, kjemi, biologi, astronomi',
    difficulty: 'Vanskelig',
    sampleQuestions: [
      'Hva er den kjemiske formelen for vann?',
      'Hva er verdens hardeste naturlige materiale?',
      'Hvor mange planeter er det i solsystemet?',
      'Hva heter stjernen som er nærmest jorden?',
      'Hvilket organ produserer insulin?',
    ],
  },
  {
    id: 'musikk',
    name: 'Musikk',
    icon: Music,
    description: 'Artister, sanger, instrumenter, sjangre',
    difficulty: 'Lett',
    sampleQuestions: [
      'Hvem er kjent som "King of Pop"?',
      'Hvilket land kommer ABBA fra?',
      'Hva heter Norges nasjonalsang?',
      'Hvilket instrument har 88 tangenter?',
      'Hvem mottok første Nobelpris i litteratur?',
    ],
  },
  {
    id: 'film',
    name: 'Film & TV',
    icon: Film,
    description: 'Filmer, serier, skuespillere, regissører',
    difficulty: 'Lett',
    sampleQuestions: [
      'Hva heter den første filmen i Star Wars?',
      'Hvem spilte hovedrollen i Titanic?',
      'Hvilken TV-serie handler om drager?',
      'Hvem regisserte Pulp Fiction?',
      'Hva heter den gule figuren i Simpsons?',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: Trophy,
    description: 'Fotball, OL, utøvere, rekorder',
    difficulty: 'Middels',
    sampleQuestions: [
      'Hvilken klubb kalles "The Red Devils"?',
      'Hvor mange gull har Michael Phelps?',
      'Hva heter Norges mestvinnende langrennsløper?',
      'Hvilket lag vant VM i fotball 2022?',
      'Hva er høyden på et volleyball-nett?',
    ],
  },
  {
    id: 'mat',
    name: 'Mat & Drikke',
    icon: Anchor,
    description: 'Nasjonalretter, ingredienser, kokker',
    difficulty: 'Lett',
    sampleQuestions: [
      'Hva er hovedingrediensen i sushi?',
      'Hvilket land er pizza fra opprinnelig?',
      'Hva heter verdens dyreste krydder?',
      'Hvilken frukt er brun utenpå og gul inni?',
      'Hva er Norges nasjonalrett?',
    ],
  },
  {
    id: 'teknologi',
    name: 'Teknologi',
    icon: Cpu,
    description: 'Data, internett, oppfinnelser, firmaer',
    difficulty: 'Middels',
    sampleQuestions: [
      'Hvem grunnla Microsoft?',
      'Hva år ble iPhone lansert?',
      'Hva er verdens største søkemotor?',
      'Hva står CPU for?',
      'Hvem oppfant lyspæren?',
    ],
  },
  {
    id: 'kunst',
    name: 'Kunst & Kultur',
    icon: Palette,
    description: 'Malerier, kunstnere, litteratur, teater',
    difficulty: 'Vanskelig',
    sampleQuestions: [
      'Hvem malte Mona Lisa?',
      'Hva heter Norges nasjonalteater?',
      'Hvem skrev "Romeo og Julie"?',
      'Hvilket kunstverk har vært stjålet flest ganger?',
      'Hva heter verdens største kunstmuseum?',
    ],
  },
  {
    id: 'natur',
    name: 'Natur & Dyr',
    icon: Brain,
    description: 'Dyr, planter, økosystemer, dinosaurer',
    difficulty: 'Lett',
    sampleQuestions: [
      'Hvilket er verdens største landdyr?',
      'Hva heter Norges nasjonalfugl?',
      'Hvilket dyr er kjent som "sjøens kamel?',
      'Hva er verdens giftigste slange?',
      'Hva heter den største havlevende pattedyr?',
    ],
  },
];

export default function QuestionSources({ onBack }: QuestionSourcesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selected = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-secondary p-3" aria-label="Tilbake">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="tv-heading text-primary">Forslag til flere spørsmål</h1>
          <p className="text-text-secondary">10 kategorier med totalt 50+ spørsmålsideer</p>
        </div>
      </div>

      {!selectedCategory ? (
        /* Kategori-grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {CATEGORIES.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(cat.id)}
                className="card group text-left p-6 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    cat.difficulty === 'Lett' ? 'bg-green-500/20 text-green-400' :
                    cat.difficulty === 'Middels' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {cat.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{cat.name}</h3>
                <p className="text-text-secondary text-sm">{cat.description}</p>
                <div className="mt-4 text-primary text-sm font-medium">
                  {cat.sampleQuestions.length} spørsmålsideer →
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Detaljvisning */
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-3xl mx-auto"
        >
          <button 
            onClick={() => setSelectedCategory(null)}
            className="btn-secondary mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til kategorier
          </button>

          {selected && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <selected.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-text-primary">{selected.name}</h2>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selected.difficulty === 'Lett' ? 'bg-green-500/20 text-green-400' :
                    selected.difficulty === 'Middels' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selected.difficulty}
                  </span>
                </div>
              </div>

              <p className="text-text-secondary mb-6">{selected.description}</p>

              <h3 className="font-semibold text-text-primary mb-4">Eksempel på spørsmål:</h3>
              <div className="space-y-3">
                {selected.sampleQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-bg-elevated rounded-xl border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-primary font-display text-xl">{index + 1}</span>
                      <p className="text-text-primary">{question}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-bg-elevated rounded-xl border border-primary/30">
                <h4 className="font-semibold text-primary mb-2">💡 Tips for å finne flere spørsmål:</h4>
                <ul className="text-text-secondary space-y-1 text-sm">
                  <li>• Søk på "quiz questions" + kategorienavn på nettet</li>
                  <li>• Bruk AI-verktøy som ChatGPT til å generere spørsmål</li>
                  <li>• Se på eksisterende quiz-apper for inspirasjon</li>
                  <li>• Spør venner og familie om deres favorittspørsmål</li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Strategi-seksjon */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-4xl mx-auto mt-12 card"
      >
        <h2 className="font-display text-2xl text-primary mb-6">📋 Strategi for å få flere spørsmål</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary">Kilder til spørsmål</h3>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span><strong>Manuell inntasting:</strong> Skriv egne spørsmål i spørsmålsbanken</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span><strong>AI-generering:</strong> Bruk ChatGPT eller Claude til å lage spørsmål</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span><strong>Import/eksport:</strong> Last opp JSON-filer med spørsmål</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                <span><strong>Åpne databaser:</strong> Open Trivia DB (gratis API med 4000+ spørsmål)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">5.</span>
                <span><strong>Folkefinansiering:</strong> La brukere sende inn spørsmål</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary">Anbefalt tilnærming</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-bg-elevated rounded-xl">
                <strong className="text-primary">Fase 1 (Nå):</strong> Bruk 50+ forhåndslagde spørsmål
              </div>
              <div className="p-3 bg-bg-elevated rounded-xl">
                <strong className="text-primary">Fase 2:</strong> Implementer import/eksport av JSON-filer
              </div>
              <div className="p-3 bg-bg-elevated rounded-xl">
                <strong className="text-primary">Fase 3:</strong> Koble til Open Trivia DB API for automatiske spørsmål
              </div>
              <div className="p-3 bg-bg-elevated rounded-xl">
                <strong className="text-primary">Fase 4:</strong> AI-assistert generering med manuell godkjenning
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
