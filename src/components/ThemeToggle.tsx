import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../lib/theme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ThemeToggle({
  className = "",
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm",
    lg: "w-11 h-11 text-sm",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4 h-4 sm:w-4.5 sm:h-4.5",
    lg: "w-5 h-5",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] select-none ${
        isDark
          ? "bg-white/10 hover:bg-white/20 text-[#fbf5b7] border border-white/15 shadow-inner"
          : "bg-black/5 hover:bg-black/10 text-[#0c1b33] border border-black/10 shadow-sm"
      } ${showLabel ? "px-3 py-1.5 gap-2 rounded-2xl w-auto" : sizeClasses[size]} ${className}`}
      aria-label={isDark ? "Switch to Normal/Light mode" : "Switch to Dark mode"}
      title={isDark ? "Switch to Normal/Light mode" : "Switch to Dark mode"}
    >
      <motion.div
        key={isDark ? "dark" : "light"}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center shrink-0"
      >
        {isDark ? (
          <Sun className={`${iconSizes[size]} text-amber-300 fill-amber-300/20 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]`} />
        ) : (
          <Moon className={`${iconSizes[size]} text-[#0c1b33] fill-[#0c1b33]/15`} />
        )}
      </motion.div>

      {showLabel && (
        <span className="font-semibold text-xs tracking-wide">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
