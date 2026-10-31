import { useTheme } from "../contexts/useTheme";
import { useLanguage } from "../contexts/useLanguage";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  const targetTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={t("theme.switchTo", { theme: t(`theme.${targetTheme}`).toLowerCase() })}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-knob" />
      </span>
      <span>{t(`theme.${isDark ? "dark" : "light"}`)}</span>
    </button>
  );
}

export default ThemeToggle;