import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadLocale } from "../i18n";

const AVAILABLE = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(() => {
    // prefer persisted user preference
    const saved = localStorage.getItem("agro_lang");
    if (saved) return saved;
    // normalize i18n language to short code like 'en' from 'en-US'
    const detected = (i18n.language || "en").split("-")[0];
    return detected;
  });

  // on mount ensure i18n reflects persisted language
  useEffect(() => {
    (async () => {
      if (lang && lang !== (i18n.language || "").split("-")[0]) {
        try {
          await loadLocale(lang);
        } catch (e) {
          console.warn(e);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // persist preference
    localStorage.setItem("agro_lang", lang);
  }, [lang]);

  const change = async (lng) => {
    setLang(lng);
    // attempt to lazy load locale bundle and cache
    try {
      await loadLocale(lng);
    } catch (e) {
      console.warn("Language load failed", e);
    }
  };

  return (
    <div
      className="language-switcher"
      style={{ display: "flex", gap: 8, alignItems: "center" }}
    >
      {AVAILABLE.map((a) => (
        <button
          key={a.code}
          onClick={() => change(a.code)}
          aria-pressed={lang === a.code}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border:
              lang === a.code
                ? "2px solid var(--primary-teal)"
                : "1px solid var(--border-light)",
            background: lang === a.code ? "var(--primary-teal)" : "transparent",
            color: lang === a.code ? "#fff" : "var(--text-primary)",
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
