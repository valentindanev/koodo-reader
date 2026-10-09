// Local fork modification: voice integration visibility, 09-10-2026.
export interface ProviderVoice {
  name: string;
  plugin?: string;
  locale: string;
  displayName?: string;
}
export const providerKey = (voice: ProviderVoice) => voice.plugin || "system";
export const parseHiddenProviders = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.filter((item) => typeof item === "string")))
      : [];
  } catch {
    return [];
  }
};
export const visibleVoices = <T extends ProviderVoice>(voices: T[], hidden: string[]) =>
  voices.filter((voice) => !hidden.includes(providerKey(voice)));
export const availableVoice = <T extends ProviderVoice>(
  voices: T[], name: string, engine: string, locale: string
): T | undefined => {
  const selected = voices.find((voice) => voice.name === name && providerKey(voice) === engine);
  if (selected) return selected;
  // Never silently switch to a paid provider when hiding the selected integration.
  const free = voices.filter((voice) => providerKey(voice) !== "official-ai-voice-plugin");
  return free.find((voice) => voice.locale === locale) || free[0];
};
