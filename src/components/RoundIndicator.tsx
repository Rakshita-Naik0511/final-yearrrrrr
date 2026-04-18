import { motion } from "framer-motion";
import { FileText, GraduationCap, Briefcase, Check } from "lucide-react";

const rounds = [
  { key: "resume", label: "Resume", icon: FileText },
  { key: "aptitude", label: "Aptitude", icon: GraduationCap },
  { key: "hr", label: "HR", icon: Briefcase },
];

interface RoundIndicatorProps {
  currentRound: string;
  completedRounds: string[];
}

const RoundIndicator = ({ currentRound, completedRounds }: RoundIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {rounds.map((round, i) => {
        const isActive = round.key === currentRound;
        const isComplete = completedRounds.includes(round.key);
        const Icon = isComplete ? Check : round.icon;

        return (
          <div key={round.key} className="flex items-center gap-2">
            <motion.div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Icon className="h-3.5 w-3.5" />
              {round.label}
            </motion.div>
            {i < rounds.length - 1 && (
              <div className={`h-px w-6 ${isComplete ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoundIndicator;
