import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, ArrowRight, ArrowLeft, FileText, Settings2 } from "lucide-react";
import ResumeUpload, { ResumeData } from "@/components/ResumeUpload";

const Setup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "configure">("upload");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [numQuestions, setNumQuestions] = useState("3");

  const normalizeExperience = (value: string) => {
    const v = (value || "").toLowerCase().trim();
    if (["fresher", "junior", "mid", "senior"].includes(v)) return v;
    if (v.includes("intern") || v.includes("student") || v.includes("entry") || v.includes("0") || v.includes("fresher")) return "fresher";
    if (v.includes("1") || v.includes("2") || v.includes("junior")) return "junior";
    if (v.includes("3") || v.includes("4") || v.includes("mid")) return "mid";
    if (v.includes("5") || v.includes("6") || v.includes("7") || v.includes("senior") || v.includes("lead")) return "senior";
    return "fresher";
  };

  const handleResumeParsed = (data: ResumeData) => {
    setResumeData(data);
    setName((data.name || "").trim());
    setRole((data.role || "").trim());
    setExperience(normalizeExperience(data.experience));
    setStep("configure");
  };

  const handleStart = () => {
    navigate("/interview", {
      state: {
        name,
        role,
        experience,
        skills: resumeData?.skills.join(", ") || "",
        resumeText: resumeData?.rawText || "",
        numQuestions: parseInt(numQuestions),
      },
    });
  };

  const isValid = !!(name.trim() && role.trim() && experience && resumeData);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo removed */}
          </div>
        </div>
      </nav>

      <div className="container max-w-2xl pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => step === "configure" ? setStep("upload") : navigate("/")} className="mb-6 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {/* Step indicators */}
          <div className="mb-8 flex items-center gap-3">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${step === "upload" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>
              <FileText className="h-3.5 w-3.5" /> 1. Upload Resume
            </div>
            <div className="h-px w-6 bg-border" />
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${step === "configure" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Settings2 className="h-3.5 w-3.5" /> 2. Configure
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "upload" ? (
              <motion.div key="upload" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-heading text-3xl font-bold text-foreground">Upload Your Resume</h1>
                <p className="mt-2 text-muted-foreground">We'll generate personalized interview questions based on your resume.</p>
                <div className="mt-8">
                  <ResumeUpload onParsed={handleResumeParsed} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="configure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="font-heading text-3xl font-bold text-foreground">Configure Interview</h1>
                <p className="mt-2 text-muted-foreground">Review your details and set preferences.</p>

                {/* Parsed resume summary */}
                {resumeData && (
                  <div className="mt-6 glass-card p-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-primary mb-2">Resume Summary</div>
                    <p className="text-sm text-muted-foreground">{resumeData.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {resumeData.skills.slice(0, 8).map((s) => (
                        <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-foreground">Your Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-card border-border" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Target Role</Label>
                    <Input value={role} onChange={(e) => setRole(e.target.value)} className="bg-card border-border" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Experience Level</Label>
                    <Select value={experience} onValueChange={setExperience}>
                      <SelectTrigger className="bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fresher">Fresher (0-1 years)</SelectItem>
                        <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                        <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Questions per Round</Label>
                    <Select value={numQuestions} onValueChange={setNumQuestions}>
                      <SelectTrigger className="bg-card border-border w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["3", "5", "7"].map((n) => (
                          <SelectItem key={n} value={n}>{n} Questions</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Round info */}
                  <div className="glass-card p-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">Interview Flow</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">1</span>
                        Resume-Based Descriptive Round
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">2</span>
                        Aptitude Round
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-bold">3</span>
                        HR Round (Video Evaluated)
                      </div>
                    </div>
                  </div>

                  <Button variant="hero" size="lg" className="w-full" disabled={!isValid} onClick={handleStart}>
                    Start Interview <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Setup;
