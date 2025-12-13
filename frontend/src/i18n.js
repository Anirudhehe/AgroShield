import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { getCachedLocale, cacheLocaleBundle } from "./utils/i18nCache";

// Embedded English core strings (minimal, used as fallback and immediate render)
const resources = {
  en: {
    translation: {
      app_title: "AgroShield",
      analyze_image: "Analyze Image",
      analyze_another: "Analyze Another Image",
      choose_image: "Choose Image",
      uploaded_photo: "Uploaded Photo",
      treatment_suggestions: "Treatment Suggestions",
      chemical: "Chemical/Synthetic",
      organic: "Organic Alternative",
      verify_badge: "⚠️ Verify with agronomist",
      copy: "Copy",
      severity_healthy: "🟢 Healthy",
      severity_severe: "🔴 Severe",
      severity_moderate: "🟠 Moderate",
      severity_mild: "🟡 Mild",
      severity_unknown: "Unknown",
    },
  },
};

// initialize i18next
i18n
  .use(HttpBackend) // fallback to HTTP fetch when not cached
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      // backend loads will be intercepted by our caching logic before HTTP
      loadPath: "/locales/{{lng}}/translation.json",
    },
  });

// Helper: try to load and cache locale bundles on demand
export async function loadLocale(lng) {
  // en is embedded
  if (!lng || lng === "en") {
    i18n.changeLanguage("en");
    return resources.en.translation;
  }

  // Try IndexedDB first
  const cached = await getCachedLocale(lng);
  if (cached) {
    // addResourceBundle merges an entire bundle into the given language/namespace
    if (!i18n.hasResourceBundle(lng, "translation")) {
      i18n.addResourceBundle(lng, "translation", cached, true, true);
    } else {
      i18n.addResourceBundle(lng, "translation", cached, true, true);
    }
    i18n.changeLanguage(lng);
    return cached;
  }

  // Fallback to fetching from network (and cache)
  try {
    const res = await fetch(`/locales/${lng}/translation.json`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Locale fetch failed");
    const json = await res.json();
    await cacheLocaleBundle(lng, json);
    if (!i18n.hasResourceBundle(lng, "translation")) {
      i18n.addResourceBundle(lng, "translation", json, true, true);
    } else {
      i18n.addResourceBundle(lng, "translation", json, true, true);
    }
    i18n.changeLanguage(lng);
    return json;
  } catch (e) {
    console.warn("Could not load locale", lng, e);
    return resources.en.translation;
  }
}

export default i18n;
