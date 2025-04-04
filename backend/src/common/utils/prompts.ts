import { Subscriber } from "@/api/subscription/model";
import * as fs from "fs";
import * as path from "path";
const readPrompts = () => {
  const promptFilePath = path.resolve(__dirname, "../../..", "prompts.json");
  const jsonFile = fs.readFileSync(promptFilePath, "utf-8");
  const prompts = JSON.parse(jsonFile);
  return prompts["prompts"] as Array<{ lang: string; prompt: string }>;
};

const readFallbackTemplates = () => {
  const templateFilePath = path.resolve(
    __dirname,
    "../../..",
    "fallbackTemplates.json",
  );
  const jsonFile = fs.readFileSync(templateFilePath, "utf-8");
  const templates = JSON.parse(jsonFile);
  return templates["templates"] as Array<{
    lang: string;
    template: string;
  }>;
};

export const PROMPTS = readPrompts();
export const FALLBACK_TEMPLATES = readFallbackTemplates();
