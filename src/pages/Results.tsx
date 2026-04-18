import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, RotateCcw, Home, CheckCircle2, AlertCircle, Globe, Loader2, FileText, GraduationCap, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const languages = [
  { code: "english", label: "English" },
  { code: "hindi", label: "हिन्दी (Hindi)" },
  { code: "tamil", label: "தமிழ் (Tamil)" },
  { code: "telugu", label: "తెలుగు (Telugu)" },
];

const roundIcons: Record<string, any> = {
  resume: FileText,
  aptitude: GraduationCap,
  hr: Briefcase,
};

const roundLabels: Record<string, string> = {
  resume: "Resume-Based Round",
  aptitude: "Aptitude Round",
  hr: "HR Round",
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roundResults, config } = location.state || {};
  const [selectedLang, setSelectedLang] = useState("english");
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState<Record<string, any>>({});

  if (!roundResults || !config) {
    navigate("/");
    return null;
  }

  const allResults = roundResults.flatMap((r: any) => r.results);
  const avgScore = allResults.reduce((sum: number, r: any) => sum + r.score, 0) / allResults.length;
  const passed = avgScore >= 6;

  const translateResults = async (lang: string) => {
    if (lang === "english" || translations[lang]) {
      setSelectedLang(lang);
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "translate_results",
          results: allResults.map((r: any) => ({
            question: r.question,
            feedback: r.feedback,
            improvedAnswer: r.improvedAnswer,
          })),
          targetLanguage: lang,
        },
      });
      if (error) throw error;
      setTranslations((prev) => ({ ...prev, [lang]: data.translatedResults }));
      setSelectedLang(lang);
    } catch (err) {
      console.error(err);
      toast({ title: "Translation failed", description: "Could not translate results.", variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const getDisplayResult = (index: number, result: any) => {
    if (selectedLang === "english" || !translations[selectedLang]) return result;
    const t = translations[selectedLang]?.[index];
    return t ? { ...result, question: t.question, feedback: t.feedback, improvedAnswer: t.improvedAnswer } : result;
  };

  let globalIdx = 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo removed */}
          </div>
          {/* Language selector */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => translateResults(lang.code)}
                disabled={translating}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedLang === lang.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {lang.label}
              </button>
            ))}
            {translating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>
      </nav>

      <div className="container max-w-3xl pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Summary */}
          <div className="glass-card glow-border p-8 text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-primary/10" : "bg-destructive/10"}`}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-primary" /> : <AlertCircle className="h-8 w-8 text-destructive" />}
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {passed ? "Great Job!" : "Keep Practicing!"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {config.name}, here are your results across all 3 rounds
            </p>

            <div className="mt-6 flex items-center justify-center gap-8">
              <div>
                <div className={`font-heading text-5xl font-bold ${avgScore >= 8 ? "text-primary" : avgScore >= 5 ? "text-yellow-400" : "text-destructive"}`}>
                  {avgScore.toFixed(1)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Overall Score</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="font-heading text-5xl font-bold text-foreground">{allResults.length}</div>
                <div className="mt-1 text-sm text-muted-foreground">Total Questions</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="font-heading text-5xl font-bold text-foreground">3</div>
                <div className="mt-1 text-sm text-muted-foreground">Rounds</div>
              </div>
            </div>

            {/* Round-wise scores */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {roundResults.map((rr: any) => {
                const roundAvg = rr.results.reduce((s: number, r: any) => s + r.score, 0) / rr.results.length;
                const Icon = roundIcons[rr.round] || FileText;
                return (
                  <div key={rr.round} className="rounded-lg bg-muted/50 p-3 text-center">
                    <Icon className="mx-auto h-5 w-5 text-primary mb-1" />
                    <div className="text-xs text-muted-foreground">{roundLabels[rr.round]}</div>
                    <div className={`font-heading text-xl font-bold ${roundAvg >= 8 ? "text-primary" : roundAvg >= 5 ? "text-yellow-400" : "text-destructive"}`}>
                      {roundAvg.toFixed(1)}/10
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed results by round */}
          {roundResults.map((rr: any) => {
            const Icon = roundIcons[rr.round] || FileText;
            return (
              <div key={rr.round} className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-xl font-semibold text-foreground">{roundLabels[rr.round]}</h2>
                </div>
                <div className="space-y-4">
                  {rr.results.map((r: any, i: number) => {
                    const idx = globalIdx++;
                    const display = getDisplayResult(idx, r);
                    return (
                      <motion.div
                        key={i}
                        className="glass-card p-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Q{i + 1}</div>
                            <h3 className="mt-1 font-heading text-sm font-medium text-foreground">{display.question}</h3>
                          </div>
                          <span className={`shrink-0 font-heading text-2xl font-bold ${r.score >= 8 ? "text-primary" : r.score >= 5 ? "text-yellow-400" : "text-destructive"}`}>
                            {r.score}/10
                          </span>
                        </div>

                        <div className="mt-4 rounded-lg bg-muted/50 p-3">
                          <div className="text-xs font-medium text-muted-foreground">Your Answer</div>
                          <p className="mt-1 text-sm text-foreground/80">{r.userAnswer}</p>
                        </div>

                        <div className="mt-3 rounded-lg bg-muted/50 p-3">
                          <div className="text-xs font-medium text-muted-foreground">Feedback</div>
                          <p className="mt-1 text-sm text-foreground/80">{display.feedback}</p>
                        </div>

                        <div className="mt-3 rounded-lg border border-primary/10 bg-primary/5 p-3">
                          <div className="text-xs font-medium text-primary">Improved Answer</div>
                          <p className="mt-1 text-sm text-foreground/80">{display.improvedAnswer}</p>
                        </div>

                        {rr.round === "hr" && r.videoAnalysis && (
                          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                            <div className="text-xs font-medium text-muted-foreground mb-2">HR Performance Analysis</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                              <div className="rounded-md bg-background/50 p-2">
                                <div className="text-muted-foreground">Confidence</div>
                                <div className="text-foreground font-medium capitalize mt-0.5">{r.videoAnalysis.confidence}</div>
                              </div>
                              <div className="rounded-md bg-background/50 p-2">
                                <div className="text-muted-foreground">Eye Contact</div>
                                <div className="text-foreground font-medium capitalize mt-0.5">{r.videoAnalysis.eyeContact}</div>
                              </div>
                              <div className="rounded-md bg-background/50 p-2">
                                <div className="text-muted-foreground">Clarity</div>
                                <div className="text-foreground font-medium capitalize mt-0.5">{r.videoAnalysis.speechClarity}</div>
                              </div>
                              <div className="rounded-md bg-background/50 p-2">
                                <div className="text-muted-foreground">Fluency</div>
                                <div className="text-foreground font-medium capitalize mt-0.5">{r.videoAnalysis.fluency}</div>
                              </div>
                              <div className="rounded-md bg-background/50 p-2">
                                <div className="text-muted-foreground">Body Language</div>
                                <div className="text-foreground font-medium capitalize mt-0.5">{r.videoAnalysis.bodyLanguage}</div>
                              </div>
                              <div className="rounded-md bg-background/50 p-2">
                                <div className="text-muted-foreground">Emotion</div>
                                <div className="text-foreground font-medium capitalize mt-0.5">{r.videoAnalysis.emotion}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Button variant="hero" size="lg" className="flex-1" onClick={() => navigate("/setup")}>
              <RotateCcw className="h-5 w-5" /> Practice Again
            </Button>
            <Button variant="glass" size="lg" className="flex-1" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" /> Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
