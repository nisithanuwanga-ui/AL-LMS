import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/useLanguage";

function BrandLockup({ className = "" }) {
  const { t } = useLanguage();

  return (
    <Link to="/" className={`brand brand-lockup ${className}`.trim()}>
      <span className="brand-logo-frame">
        <img
          className="brand-logo"
          src="/nisova-logo.png"
          alt={t("brand.logoAlt")}
        />
      </span>
      <span className="brand-copy">
        <span className="brand-name">Nisova Learning</span>
        <span className="brand-tagline">{t("brand.tagline")}</span>
      </span>
    </Link>
  );
}

export default BrandLockup;
