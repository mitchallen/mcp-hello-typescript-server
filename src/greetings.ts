// Greeting data for the demo `greet` tool.
//
// Maps a handful of languages to a greeting word. Lookups are case-insensitive
// and also accept common alternate spellings / ISO codes (e.g. `fr` or
// `Français` for French). Add a language by adding a row to `GREETINGS` (and,
// optionally, an alias to `ALIASES`).

// Canonical language name -> greeting word, in definition order. An array (not
// a map) so the order is stable — server_info reports the set in this order.
export const GREETINGS: ReadonlyArray<readonly [string, string]> = [
  ["english", "Hello"],
  ["spanish", "Hola"],
  ["french", "Bonjour"],
  ["german", "Hallo"],
  ["italian", "Ciao"],
  ["portuguese", "Olá"],
  ["japanese", "こんにちは (Konnichiwa)"],
  ["hawaiian", "Aloha"],
];

// Language used when the caller doesn't specify one.
export const DEFAULT_LANGUAGE = "english";

// Alternate spellings / ISO codes -> canonical language name.
export const ALIASES: Readonly<Record<string, string>> = {
  en: "english",
  es: "spanish",
  espanol: "spanish",
  español: "spanish",
  fr: "french",
  francais: "french",
  français: "french",
  de: "german",
  deutsch: "german",
  it: "italian",
  italiano: "italian",
  pt: "portuguese",
  portugues: "portuguese",
  português: "portuguese",
  ja: "japanese",
  jp: "japanese",
  nihongo: "japanese",
  haw: "hawaiian",
};

// A successful greet result: { language, greeting, message }. A type alias (not
// an interface) so it satisfies the SDK's index-signature-typed
// `structuredContent`.
export type Greeting = {
  language: string;
  greeting: string;
  message: string;
};

// languages returns the languages this server knows how to greet in, in
// definition order.
export function languages(): string[] {
  return GREETINGS.map(([name]) => name);
}

// greetingWord returns the greeting word for a canonical language name.
function greetingWord(canonical: string): string | undefined {
  return GREETINGS.find(([name]) => name === canonical)?.[1];
}

// resolveLanguage returns the canonical language name for `language`.
//
// It accepts a canonical name, an alias, or an ISO code (case-insensitive). An
// undefined or blank value yields the default (English). It throws an Error
// listing the supported set for an unknown language.
export function resolveLanguage(language?: string): string {
  const key = (language ?? "").trim().toLowerCase();
  if (key === "") {
    return DEFAULT_LANGUAGE;
  }
  if (greetingWord(key) !== undefined) {
    return key;
  }
  const canonical = ALIASES[key];
  if (canonical !== undefined) {
    return canonical;
  }
  throw new Error(
    `unknown language '${language}'; supported: ${languages().join(", ")}`,
  );
}

// greet builds a Greeting for `language` (default English). Pass a non-empty
// `name` to personalize the message (e.g. "Bonjour, Alice!"). Throws for an
// unknown language.
export function greet(language?: string, name?: string): Greeting {
  const canonical = resolveLanguage(language);
  const word = greetingWord(canonical)!;
  const trimmedName = (name ?? "").trim();
  const message = trimmedName ? `${word}, ${trimmedName}!` : `${word}!`;
  return { language: canonical, greeting: word, message };
}
