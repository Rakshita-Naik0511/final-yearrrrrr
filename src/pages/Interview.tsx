import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Loader2, ChevronRight, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Webcam, { VideoAnalysis } from "@/components/Webcam";
import MicRecorder from "@/components/MicRecorder";
import RoundIndicator from "@/components/RoundIndicator";

interface InterviewConfig {
  name: string;
  role: string;
  experience: string;
  skills: string;
  resumeText: string;
  numQuestions: number;
}

interface QuestionData {
  question: string;
  category: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface AnswerFeedback {
  score: number;
  feedback: string;
  improvedAnswer: string;
}

interface RoundResult {
  round: string;
  results: (AnswerFeedback & { question: string; userAnswer: string; videoAnalysis?: VideoAnalysis })[];
}

const ROUNDS = ["resume", "aptitude", "hr"] as const;

const getFallbackQuestions = (roundType: string, numQuestions: number, role: string): QuestionData[] => {
  const n = Math.max(1, Math.min(10, Number(numQuestions) || 3));
  const pool: QuestionData[] =
    roundType === "aptitude"
      ? [
          {
            question: "If 5 machines produce 500 units in 10 hours, how many units will 10 machines produce in 10 hours?",
            category: "Numerical Ability",
            options: ["500", "750", "1000", "1200"],
            correctAnswer: "1000",
            explanation: "Output is directly proportional to number of machines when time is constant.",
          },
          {
            question: "Find the next number in the pattern: 3, 6, 11, 18, 27, ?",
            category: "Logical Reasoning",
            options: ["36", "38", "40", "42"],
            correctAnswer: "38",
            explanation: "Differences are +3, +5, +7, +9, so next is +11.",
          },
          {
            question: "Choose the correct word: 'She has been working here ___ 2022.'",
            category: "Verbal Reasoning",
            options: ["since", "for", "from", "by"],
            correctAnswer: "since",
            explanation: "Use 'since' with a starting point in time.",
          },
        ]
      : roundType === "hr"
      ? [
          { question: "Tell me about yourself and why you are interested in this role.", category: "HR" },
          { question: "Describe a conflict you faced in a team and how you resolved it.", category: "Behavioral" },
          { question: "Where do you see yourself in the next 3 years?", category: "Career Goals" },
        ]
      : [
          { question: `Walk me through a project that best demonstrates your fit for a ${role} role.`, category: "Resume" },
          { question: "Explain a difficult bug you fixed and your debugging process.", category: "Technical Experience" },
          { question: "Describe a feature you built end-to-end and the trade-offs you made.", category: "System Thinking" },
        ];

  return Array.from({ length: n }, (_, i) => pool[i % pool.length]);
};

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state as InterviewConfig | null;

  const [currentRound, setCurrentRound] = useState<string>("resume");
  const [completedRounds, setCompletedRounds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<AnswerFeedback | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [currentRoundResults, setCurrentRoundResults] = useState<(AnswerFeedback & { question: string; userAnswer: string; videoAnalysis?: VideoAnalysis })[]>([]);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);

  useEffect(() => {
    if (!config) {
      navigate("/setup");
      return;
    }
    generateQuestions("resume");
  }, []);

  const generateQuestions = async (roundType: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "generate_questions",
          role: config!.role,
          experience: config!.experience,
          skills: config!.skills,
          roundType,
          numQuestions: config!.numQuestions,
          resumeText: config!.resumeText,
        },
      });
      if (error) throw error;
      const apiQuestions = Array.isArray(data?.questions) ? data.questions : [];
      if (apiQuestions.length === 0) {
        throw new Error("No questions returned from API");
      }
      setQuestions(apiQuestions);
      setCurrentIndex(0);
      setAnswer("");
      setCurrentFeedback(null);
      setCurrentRoundResults([]);
    } catch (err) {
      console.error(err);
      // Keep the interview moving even if backend AI is unavailable.
      const fallback = getFallbackQuestions(roundType, config!.numQuestions, config!.role);
      setQuestions(fallback);
      setCurrentIndex(0);
      setAnswer("");
      setCurrentFeedback(null);
      setCurrentRoundResults([]);
      toast({ title: "Using backup questions", description: "AI service is unavailable right now.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setCurrentFeedback(null);

    const q = questions[currentIndex];

    // MCQ: evaluate locally
    if (q.options && q.options.length > 0 && q.correctAnswer) {
      const isCorrect = answer === q.correctAnswer;
      const fb: AnswerFeedback = {
        score: isCorrect ? 10 : 0,
        feedback: isCorrect
          ? `Correct! ${q.explanation || ""}`.trim()
          : `Incorrect. The correct answer is "${q.correctAnswer}". ${q.explanation || ""}`.trim(),
        improvedAnswer: q.correctAnswer,
      };
      setCurrentFeedback(fb);
      setCurrentRoundResults((prev) => [...prev, { ...fb, question: q.question, userAnswer: answer }]);
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate_answer",
          question: q.question,
          answer,
          role: config!.role,
          roundType: currentRound,
          videoAnalysis: currentRound === "hr" ? videoAnalysis : undefined,
        },
      });
      if (error) throw error;

      setCurrentFeedback(data);
      setCurrentRoundResults((prev) => [
        ...prev,
        { ...data, question: q.question, userAnswer: answer, videoAnalysis: currentRound === "hr" ? videoAnalysis ?? undefined : undefined },
      ]);
    } catch (err) {
      console.error(err);
      const fallbackFeedback: AnswerFeedback = {
        score: Math.max(4, Math.min(9, Math.round((answer.trim().length / 40) * 2 + 4))),
        feedback: "Your answer is recorded. Be more specific, use structured points, and include one concrete example for stronger impact.",
        improvedAnswer: `${answer.trim()}\n\n(Improved) I addressed the problem with a clear approach, collaborated with my team, and achieved measurable results.`,
      };
      setCurrentFeedback(fallbackFeedback);
      setCurrentRoundResults((prev) => [
        ...prev,
        { ...fallbackFeedback, question: q.question, userAnswer: answer, videoAnalysis: currentRound === "hr" ? videoAnalysis ?? undefined : undefined },
      ]);
      toast({ title: "Using backup evaluation", description: "AI evaluator is unavailable right now.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVideoAnalysis = useCallback((data: VideoAnalysis) => {
    setVideoAnalysis(data);
  }, []);

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      // Round complete
      const updatedRoundResults = [...roundResults, { round: currentRound, results: currentRoundResults }];
      setRoundResults(updatedRoundResults);
      setCompletedRounds((prev) => [...prev, currentRound]);

      const roundIdx = ROUNDS.indexOf(currentRound as any);
      if (roundIdx + 1 >= ROUNDS.length) {
        // All rounds done
        navigate("/results", { state: { roundResults: updatedRoundResults, config } });
        return;
      }

      // Next round
      const nextRound = ROUNDS[roundIdx + 1];
      setCurrentRound(nextRound);
      generateQuestions(nextRound);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setAnswer("");
    setCurrentFeedback(null);
  };

  if (!config) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 font-heading text-lg text-foreground">
            Preparing {currentRound === "resume" ? "Resume-Based" : currentRound === "aptitude" ? "Aptitude" : "HR"} Round...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">AI is generating personalized questions</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo removed */}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{currentIndex + 1}/{questions.length}</span>
          </div>
        </div>
      </nav>

      <div className="container pt-28 pb-16">
        {/* Round indicator */}
        <div className="mb-6">
          <RoundIndicator currentRound={currentRound} completedRounds={completedRounds} />
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1.5 rounded-full bg-secondary max-w-3xl mx-auto">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex gap-6 max-w-5xl mx-auto">
          {/* Main content */}
          <div className="flex-1 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentRound}-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="glass-card p-8">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
                    {questions[currentIndex]?.category || currentRound}
                  </div>
                  <h2 className="font-heading text-xl font-semibold leading-relaxed text-foreground">
                    {questions[currentIndex]?.question}
                  </h2>
                </div>

                <div className="mt-6">
                  {questions[currentIndex]?.options && questions[currentIndex].options!.length > 0 ? (
                    <div className="space-y-2">
                      {questions[currentIndex].options!.map((opt, i) => {
                        const selected = answer === opt;
                        const isCorrect = !!currentFeedback && opt === questions[currentIndex].correctAnswer;
                        const isWrongPick = !!currentFeedback && selected && opt !== questions[currentIndex].correctAnswer;
                        return (
                          <button
                            key={i}
                            disabled={!!currentFeedback}
                            onClick={() => setAnswer(opt)}
                            className={`glass-card flex w-full items-center gap-3 p-4 text-left transition-all ${
                              isCorrect
                                ? "border-primary bg-primary/10"
                                : isWrongPick
                                ? "border-destructive bg-destructive/10"
                                : selected
                                ? "border-primary"
                                : "hover:border-primary/40"
                            }`}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-foreground">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-sm text-foreground">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentRound === "hr" && (
                        <MicRecorder
                          value={answer}
                          onTranscript={setAnswer}
                          disabled={!!currentFeedback}
                        />
                      )}
                      <Textarea
                        placeholder={currentRound === "hr" ? "Click 'Start Speaking' to answer with your voice, or type here..." : "Type your answer here..."}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="min-h-[160px] bg-card border-border text-foreground placeholder:text-muted-foreground"
                        disabled={!!currentFeedback}
                      />
                    </div>
                  )}

                  {!currentFeedback && (
                    <Button variant="hero" size="lg" className="mt-4 w-full" onClick={submitAnswer} disabled={!answer.trim() || submitting}>
                      {submitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> Evaluating...</>) : (<><Send className="h-5 w-5" /> Submit Answer</>)}
                    </Button>
                  )}
                </div>

                {currentFeedback && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Score</span>
                        <span className={`font-heading text-3xl font-bold ${
                          currentFeedback.score >= 8 ? "text-primary" : currentFeedback.score >= 5 ? "text-yellow-400" : "text-destructive"
                        }`}>{currentFeedback.score}/10</span>
                      </div>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">Feedback</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{currentFeedback.feedback}</p>
                    </div>

                    <div className="glass-card border-primary/20 p-6">
                      <h3 className="mb-2 font-heading text-sm font-semibold text-primary">Improved Answer</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{currentFeedback.improvedAnswer}</p>
                    </div>

                    <Button variant="hero" size="lg" className="w-full" onClick={nextQuestion}>
                      {currentIndex + 1 >= questions.length
                        ? ROUNDS.indexOf(currentRound as any) + 1 >= ROUNDS.length
                          ? "View Results"
                          : `Next Round: ${ROUNDS[ROUNDS.indexOf(currentRound as any) + 1] === "aptitude" ? "Aptitude" : "HR"}`
                        : "Next Question"
                      } <ChevronRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Webcam sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28 space-y-4">
              <Webcam onAnalysisUpdate={handleVideoAnalysis} isActive={true} />
              {videoAnalysis && currentRound === "hr" && (
                <div className="glass-card p-3 space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">Live Analysis</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className="text-foreground capitalize">{videoAnalysis.confidence}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Eye Contact</span><span className="text-foreground capitalize">{videoAnalysis.eyeContact}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Clarity</span><span className="text-foreground capitalize">{videoAnalysis.speechClarity}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fluency</span><span className="text-foreground capitalize">{videoAnalysis.fluency}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Body Lang.</span><span className="text-foreground capitalize">{videoAnalysis.bodyLanguage}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Emotion</span><span className="text-foreground capitalize">{videoAnalysis.emotion}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
