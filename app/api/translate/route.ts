import type { NextRequest } from "next/server"

const HF_TEXT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

async function hfGenerate(prompt: string) {
  const token = process.env.HUGGING_FACE_API_TOKEN
  if (!token) throw new Error("Missing HUGGING_FACE_API_TOKEN")

  const res = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(HF_TEXT_MODEL)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.2,
        // top_p, repetition_penalty, etc. can be added if needed
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.log("[v0] HF translate error:", res.status, body)
    throw new Error("HF request failed")
  }

  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    const json = await res.json()
    // HF text-generation often returns an array with { generated_text }
    if (Array.isArray(json) && json[0]?.generated_text) return String(json[0].generated_text)
    if (json?.generated_text) return String(json.generated_text)
    // Fallback: best-effort stringify
    return typeof json === "string" ? json : JSON.stringify(json)
  }
  // Fallback to plain text
  return await res.text()
}

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json()
    if (typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 })
    }
    const lang = typeof targetLang === "string" && targetLang.trim() ? targetLang : "English"

    const prompt =
      `Translate the following text into ${lang}. Only return the translation with no explanations:\n\n` + text

    const out = (await hfGenerate(prompt)).trim()

    return new Response(JSON.stringify({ translation: out }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    console.log("[v0] /api/translate error:", e?.message)
    return new Response(JSON.stringify({ error: "Translation failed" }), { status: 500 })
  }
}
