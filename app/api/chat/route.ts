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
        temperature: 0.5,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.log("[v0] HF chat error:", res.status, body)
    throw new Error("HF request failed")
  }

  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    const json = await res.json()
    if (Array.isArray(json) && json[0]?.generated_text) return String(json[0].generated_text)
    if (json?.generated_text) return String(json.generated_text)
    return typeof json === "string" ? json : JSON.stringify(json)
  }
  return await res.text()
}

type Msg = { role: "user" | "assistant"; content: string }

export async function POST(req: NextRequest) {
  try {
    const { messages, targetLang } = await req.json()
    const lang = typeof targetLang === "string" && targetLang.trim() ? targetLang : "English"

    const history: Msg[] = Array.isArray(messages) ? messages : []
    const context = history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")
    const lastUser = history.filter((m) => m.role === "user").slice(-1)[0]?.content || ""

    const prompt =
      `System: You are a helpful assistant. Reply strictly in ${lang}. Be concise and helpful.\n\n` +
      `Conversation so far:\n${context}\n\n` +
      `User: ${lastUser}\nAssistant:`

    const raw = await hfGenerate(prompt)
    const reply = raw.replace(/^System:.*?\n/i, "").trim()

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    console.log("[v0] /api/chat error:", e?.message)
    return new Response(JSON.stringify({ error: "Chat failed" }), { status: 500 })
  }
}
