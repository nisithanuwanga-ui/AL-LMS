import { useLanguage } from "../contexts/useLanguage";

function LearningIllustration() {
  const { t } = useLanguage();

  return (
    <svg
      className="learning-illustration"
      viewBox="0 0 640 520"
      role="img"
      aria-label={t("auth.illustrationAlt")}
    >
      <defs>
        <linearGradient id="illustration-glow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#5f8cff" />
          <stop offset="1" stopColor="#a67aff" />
        </linearGradient>
        <linearGradient id="illustration-screen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#dce8ff" />
          <stop offset="1" stopColor="#f4eaff" />
        </linearGradient>
      </defs>
      <circle cx="325" cy="248" r="205" fill="#ffffff" opacity=".055" />
      <circle cx="325" cy="248" r="164" fill="none" stroke="#ffffff" strokeOpacity=".12" />
      <path d="M92 381h444" stroke="#ffffff" strokeOpacity=".22" strokeWidth="2" />
      <path d="m125 380 24-85 29 85M148 330h22" fill="none" stroke="#a9c5ff" strokeLinecap="round" strokeWidth="7" />
      <rect x="424" y="130" width="104" height="164" rx="14" fill="#ffffff" opacity=".1" stroke="#ffffff" strokeOpacity=".3" />
      <rect x="440" y="150" width="72" height="8" rx="4" fill="#ffffff" opacity=".72" />
      <rect x="440" y="170" width="54" height="6" rx="3" fill="#a9c5ff" opacity=".8" />
      <rect x="440" y="187" width="62" height="6" rx="3" fill="#a9c5ff" opacity=".48" />
      <rect x="440" y="220" width="72" height="52" rx="9" fill="url(#illustration-glow)" opacity=".8" />
      <path d="m457 255 13-15 10 9 13-17" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <rect x="196" y="250" width="234" height="133" rx="13" fill="#f3f6ff" />
      <path d="M209 266h208v103H209z" fill="url(#illustration-screen)" />
      <rect x="224" y="280" width="83" height="8" rx="4" fill="#6283c6" opacity=".7" />
      <rect x="224" y="298" width="64" height="5" rx="2.5" fill="#8195bd" opacity=".5" />
      <rect x="224" y="312" width="89" height="5" rx="2.5" fill="#8195bd" opacity=".38" />
      <circle cx="352" cy="311" r="24" fill="none" stroke="url(#illustration-glow)" strokeWidth="6" />
      <path d="M352 287a24 24 0 0 1 22 15" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="6" />
      <path d="M183 383h259l-21 17H204z" fill="#d9e3fa" />
      <path d="M244 389h136" stroke="#9baed4" strokeLinecap="round" strokeWidth="4" />
      <path d="M272 401h81l14 36h-109z" fill="#6d8bc4" />
      <path d="M222 430h183" stroke="#9db5e5" strokeLinecap="round" strokeWidth="8" />
      <rect x="110" y="336" width="56" height="43" rx="5" transform="rotate(-8 110 336)" fill="#b9c9ee" />
      <rect x="116" y="328" width="56" height="43" rx="5" transform="rotate(-8 116 328)" fill="#ffffff" />
      <path d="m128 342 29-4M130 351l25-3M132 360l19-3" stroke="#8ba1cf" strokeLinecap="round" strokeWidth="3" />
      <circle cx="201" cy="170" r="25" fill="#d3a68e" />
      <path d="M177 169c1-24 13-37 31-34 13 2 20 12 20 27-9-8-20-12-34-10-4 8-9 13-17 17Z" fill="#202c49" />
      <path d="M161 247c2-35 17-54 42-54 27 0 43 20 45 58l-9 72h-72z" fill="#7964c8" />
      <path d="m178 215-24 38 22 13M226 215l24 33-20 18" fill="none" stroke="#d3a68e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13" />
      <path d="M181 320h22v63h-29zM220 320h22l15 63h-29z" fill="#273553" />
      <path d="M172 383h32M226 383h34" stroke="#d3a68e" strokeLinecap="round" strokeWidth="10" />
      <path d="m370 117 8 18 19 2-14 12 4 19-17-10-17 10 4-19-14-12 19-2z" fill="#9ebaff" opacity=".9" />
      <circle cx="112" cy="225" r="5" fill="#c6adff" />
      <circle cx="522" cy="330" r="6" fill="#8bb4ff" />
      <circle cx="405" cy="80" r="4" fill="#ffffff" opacity=".7" />
    </svg>
  );
}

export default LearningIllustration;
