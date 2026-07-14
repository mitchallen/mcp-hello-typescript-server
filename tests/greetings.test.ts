// Unit tests for the greeting resolver/builder (no MCP layer).

import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_LANGUAGE, greet, resolveLanguage } from "../src/greetings.js";

test("default language is english", () => {
  assert.equal(DEFAULT_LANGUAGE, "english");
  for (const input of [undefined, "", "   "]) {
    assert.equal(resolveLanguage(input), "english");
  }
});

test("resolve is case-insensitive", () => {
  assert.equal(resolveLanguage("French"), "french");
  assert.equal(resolveLanguage("  SPANISH  "), "spanish");
});

test("resolve accepts aliases and ISO codes", () => {
  const cases: Record<string, string> = {
    fr: "french",
    es: "spanish",
    jp: "japanese",
    Français: "french",
  };
  for (const [input, want] of Object.entries(cases)) {
    assert.equal(resolveLanguage(input), want);
  }
});

test("resolve unknown language throws and lists supported set", () => {
  assert.throws(
    () => resolveLanguage("klingon"),
    (err: Error) => {
      // The error lists the supported languages so a caller can recover.
      return (
        err.message.includes("supported") && err.message.includes("english")
      );
    },
  );
});

test("greet defaults to english", () => {
  const g = greet();
  assert.deepEqual(g, {
    language: "english",
    greeting: "Hello",
    message: "Hello!",
  });
});

test("greet in french", () => {
  const g = greet("French");
  assert.equal(g.language, "french");
  assert.equal(g.message, "Bonjour!");
});

test("greet personalized", () => {
  const g = greet("french", "Alice");
  assert.equal(g.message, "Bonjour, Alice!");
});
