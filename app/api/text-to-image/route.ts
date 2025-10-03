import type { NextRequest } from "next/server"

const HF_MODEL = "black-forest-labs/FLUX.1-dev" // strong general model; swap if preferred

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (typeof prompt !== "string" || !prompt.trim()) {
      return new Response("Missing prompt", { status: 400 })
    }

    const token = process.env.HUGGING_FACE_API_TOKEN
    if (!token) {
      return new Response("Missing HUGGING_FACE_API_TOKEN", { status: 500 })
    }

    const res = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        // optional params can be tuned as needed
        parameters: { guidance_scale: 5, num_inference_steps: 28 },
      }),
    })

    if (!res.ok) {
      const t = await res.text()
      console.log("[v0] HF t2i error:", res.status, t)
      return new Response("HF generation failed", { status: 500 })
    }

    // HF may return image bytes directly or JSON with a b64. Server tries to handle binary.
    const contentType = res.headers.get("content-type") || "image/png"
    const buf = await res.arrayBuffer()
    return new Response(buf, { headers: { "Content-Type": contentType } })
  } catch (e: any) {
    console.log("[v0] /api/text-to-image error:", e?.message)
    return new Response("Failed to generate image", { status: 500 })
  }
}
