import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ProblemDiagnosis = {
  trade: string;
  urgency: "low" | "medium" | "high";
  estimatedCost: string;
  advice: string;
};

const TRADES = ["Plumber", "Electrician", "Carpenter", "Painter", "AC Technician", "Mason"];

function fallbackDiagnose(description: string): ProblemDiagnosis {
  const d = description.toLowerCase();
  const pick = (words: string[], trade: string) => words.some((w) => d.includes(w)) && trade;
  const trade =
    pick(["leak", "tap", "pipe", "sink", "toilet", "geyser", "drain", "bathroom"], "Plumber") ||
    pick(["wire", "wiring", "switch", "fan", "power", "light", "inverter", "short", "fuse", "mcb"], "Electrician") ||
    pick(["ac", "air conditioner", "cooling", "gas refill"], "AC Technician") ||
    pick(["door", "furniture", "wardrobe", "wood", "hinge", "table", "shelf"], "Carpenter") ||
    pick(["paint", "wall colour", "seepage", "damp", "waterproof"], "Painter") ||
    pick(["tile", "brick", "plaster", "crack", "floor", "renovation", "wall"], "Mason") ||
    "Plumber";
  const urgent = ["burst", "flood", "spark", "smoke", "no power", "emergency", "gas"].some((w) =>
    d.includes(w),
  );
  return {
    trade,
    urgency: urgent ? "high" : "medium",
    estimatedCost: "₹500 – ₹2,500",
    advice:
      "A verified local pro can inspect this. Describe the problem with photos when you book for a faster, more accurate quote.",
  };
}

export const diagnoseProblem = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ description: z.string().min(5) }).parse(data))
  .handler(async ({ data }): Promise<ProblemDiagnosis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fallbackDiagnose(data.description);
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [
            {
              role: "system",
              content: `You diagnose home-repair problems for an Indian home-services marketplace. Reply with ONLY compact JSON: {"trade": one of ${TRADES.join("/")}, "urgency": "low"|"medium"|"high", "estimatedCost": a rupee range like "₹800 – ₹2,000", "advice": one or two plain sentences of practical guidance}. No markdown.`,
            },
            { role: "user", content: data.description },
          ],
        }),
      });
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return fallbackDiagnose(data.description);
      const parsed = JSON.parse(match[0]) as ProblemDiagnosis;
      if (!TRADES.includes(parsed.trade)) return fallbackDiagnose(data.description);
      return parsed;
    } catch {
      return fallbackDiagnose(data.description);
    }
  });
