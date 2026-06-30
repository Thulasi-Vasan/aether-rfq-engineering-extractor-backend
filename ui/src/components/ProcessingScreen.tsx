import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, FileSearch, Layers, Zap } from "lucide-react";

const STEPS = [
  { icon: FileSearch, label: "Parsing engineering drawing PDF…" },
  { icon: Cpu, label: "Analyzing STEP geometry features…" },
  { icon: Layers, label: "Extracting machining operations…" },
  { icon: Zap, label: "Finalizing operation sequence…" },
];

export default function ProcessingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const durations = [3000, 5000, 8000];
    const t = setTimeout(() => setStep((s) => s + 1), durations[step] ?? 4000);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg text-center"
      >
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-bg-panel" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-blue animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="w-7 h-7 text-navy-700" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-navy-900 mb-2">
          Analyzing your files
        </h2>
        <p className="text-sm text-text-secondary mb-8">
          Extracting machining operations from your drawing and 3D model. This
          typically takes 1 to 2 minutes.
        </p>

        {/* Step list */}
        <div className="bg-white rounded-2xl border border-border p-6 text-left space-y-4 mb-6"
          style={{ boxShadow: "0 4px 24px rgba(10,22,40,0.07)" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                    done
                      ? "bg-success-bg"
                      : active
                        ? "bg-accent-light"
                        : "bg-bg-panel"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors duration-500 ${
                      done
                        ? "text-success"
                        : active
                          ? "text-accent-blue"
                          : "text-text-muted"
                    }`}
                  />
                </div>
                <AnimatePresence mode="wait">
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      done
                        ? "text-success line-through decoration-success/40"
                        : active
                          ? "text-navy-900"
                          : "text-text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </AnimatePresence>
                {active && (
                  <span className="ml-auto flex gap-0.5">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce"
                        style={{ animationDelay: `${d * 150}ms` }}
                      />
                    ))}
                  </span>
                )}
                {done && (
                  <span className="ml-auto text-xs text-success font-medium">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </motion.div>
    </div>
  );
}
