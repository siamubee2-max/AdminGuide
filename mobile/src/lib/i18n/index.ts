import { useSettingsStore } from '../state/settings-store';
import { translations, type Language, type TranslationKey } from './translations';

export type { Language, TranslationKey };
export { translations };

/**
 * Hook to get the current translation function.
 * Usage: const t = useTranslation(); t('home.greeting_morning')
 */
export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const lang: Language = language ?? 'fr';

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = translations[lang];
    let text = dict[key] ?? translations.fr[key] ?? key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  }

  return t;
}

/**
 * Get translation without hook (for use outside components).
 */
export function getTranslation(lang: Language) {
  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = translations[lang] ?? translations.fr;
    let text = dict[key] ?? translations.fr[key] ?? key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return text;
  }

  return t;
}

export const LANGUAGES: { id: Language; label: string; flag: string }[] = [
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'en', label: 'English (US)', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
];

/**
 * Get the speech language code for expo-speech
 */
export function getSpeechLanguageCode(lang: Language): string {
  const codes: Record<Language, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
  };
  return codes[lang] ?? 'fr-FR';
}

/**
 * Get language name in its own language for AI prompts
 */
export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = {
    fr: 'français',
    en: 'English',
    es: 'español',
  };
  return names[lang] ?? 'français';
}
