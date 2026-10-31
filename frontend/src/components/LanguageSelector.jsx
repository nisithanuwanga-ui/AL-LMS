import { LANGUAGE_OPTIONS } from "../i18n/translations";
import { useLanguage } from "../contexts/useLanguage";

function LanguageSelector({ className = "" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`language-selector ${className}`.trim()}>
      <span className="language-selector-label">{t("language.label")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("language.label")}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSelector;
