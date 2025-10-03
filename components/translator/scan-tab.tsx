"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Tesseract from "tesseract.js"

export default function ScanTab() {
  const [image, setImage] = useState<File | null>(null)
  const [originalText, setOriginalText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [targetLang, setTargetLang] = useState("English")
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onFile = (f: File | null) => {
    setImage(f)
    setOriginalText("")
    setTranslatedText("")
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  const extract = async () => {
    if (!image) return
    setProcessing(true)
    try {
      const { data } = await Tesseract.recognize(image, "eng")
      setOriginalText(data.text || "")
    } catch (e) {
      console.log("[v0] OCR error:", (e as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const translate = async () => {
    if (!originalText.trim()) return
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText, targetLang }),
      })
      const data = await res.json()
      setTranslatedText(data.translation || "")
    } catch (e) {
      console.log("[v0] translate error:", (e as Error).message)
    }
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            aria-label="Upload image for OCR"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <Button onClick={extract} disabled={!image || processing}>
            {processing ? "Extracting..." : "Extract Text"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">{"Translate to:"}</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="border rounded-md bg-background px-2 py-1"
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Chinese</option>
            <option>Japanese</option>
          </select>
          <Button onClick={translate} variant="secondary">
            Translate
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 rounded-md border">
          <h3 className="font-medium mb-2">{"Original"}</h3>
          {previewUrl ? (
            // alt text describes purpose; if it's purely referential we still provide basic alt
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Uploaded for OCR"
              className="w-full h-auto rounded-md mb-3"
            />
          ) : null}
          <pre className="text-sm whitespace-pre-wrap min-h-32">{originalText || "…"}</pre>
        </div>
        <div className="p-3 rounded-md border">
          <h3 className="font-medium mb-2">{"Translated"}</h3>
          <pre className="text-sm whitespace-pre-wrap min-h-32">{translatedText || "…"}</pre>
        </div>
      </div>
    </div>
  )
}
