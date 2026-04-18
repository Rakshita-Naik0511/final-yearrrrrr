import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Mic, BarChart3, ArrowRight, Sparkles, Users, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Questions",
    description: "Personalized questions generated based on your role, skills, and experience level.",
  },
  {
    icon: Mic,
    title: "Multi-Round Interviews",
    description: "Practice aptitude, technical, and HR rounds with real-time evaluation.",
  },
  {
    icon: BarChart3,
    title: "Detailed Feedback",
    description: "Get comprehensive scores, improved answers, and actionable insights.",
  },
];

const stats = [
  { value: "10K+", label: "Mock Interviews" },
  { value: "93%", label: "Accuracy Rate" },
  { value: "500+", label: "Job Roles" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo removed */}
          </div>
          <Button variant="hero" size="sm" onClick={() => navigate("/setup")}>
            Start Practice <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(160,84%,39%,0.08)_0%,_transparent_70%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Multimodal AI Interview Platform
            </div>

            <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Ace Your Next
              <br />
              <span className="text-gradient">Interview</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Practice with AI-generated questions tailored to your skills. Get real-time feedback on your answers, communication, and confidence.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="lg" onClick={() => navigate("/setup")}>
                Start Mock Interview <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="glass" size="lg" onClick={() => navigate("/setup")}>
                Quick Practice
              </Button>
            </div>
          </motion.div>

          {/* Stats section removed */}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <div className="container">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Prepare
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Our AI platform covers every aspect of interview preparation with intelligent analysis.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="glass-card p-8 transition-all duration-300 hover:border-primary/30"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 py-24">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl glass-card glow-border p-12"
          >
            <h2 className="font-heading text-3xl font-bold text-foreground">Ready to Practice?</h2>
            <p className="mt-4 text-muted-foreground">
              Set up your profile and start a mock interview in under a minute.
            </p>
            <Button variant="hero" size="lg" className="mt-8" onClick={() => navigate("/setup")}>
              Get Started Now <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {/* Logo removed */}
          </div>
          <p>Multimodal AI Interview Practice Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
