"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function PromptTab() {
  const [prompt, setPrompt] = useState("")
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setImgUrl(null)
    try {
      // Translate to English first for better image models
      const t = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt, targetLang: "English" }),
      })
      const tData = await t.json()
      const englishPrompt = tData.translation || prompt

      const res = await fetch("/api/text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: englishPrompt }),
      })
      if (!res.ok) throw new Error("Image generation failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setImgUrl(url)
    } catch (e) {
      console.log("[v0] t2i error:", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="t2i-prompt" className="text-sm font-medium">
          {"Describe the image (any language):"}
        </label>
        <textarea
          id="t2i-prompt"
          className="border rounded-md bg-background p-2 min-h-24"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A cozy café street scene at dusk…"
        />
        <div className="flex gap-2">
          <Button onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate Image"}
          </Button>
        </div>
      </div>

      <div className="border rounded-md p-3 min-h-64 flex items-center justify-center">
        {imgUrl ? (
          <img src={imgUrl || "/placeholder.svg"} alt="Generated result" className="max-h-[512px] w-auto rounded-md" />
        ) : (
          <img src="/empty-image-placeholder.jpg" alt="" aria-hidden="true" className="opacity-60" />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {"Requires HUGGING_FACE_API_TOKEN for server-side image generation."}
      </p>
    </div>
  )
}
