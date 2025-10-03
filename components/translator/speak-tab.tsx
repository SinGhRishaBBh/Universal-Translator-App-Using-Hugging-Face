"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type RecognitionType = any

export default function SpeakTab() {
  const [recording, setRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLang, setSourceLang] = useState("auto")
  const [targetLang, setTargetLang] = useState("English")
  const recognitionRef = useRef<RecognitionType | null>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = sourceLang === "auto" ? undefined : sourceLang
      recognition.interimResults = true
      recognition.continuous = true
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join(" ")
        setRecognizedText(transcript)
      }
      recognition.onerror = (e: any) => {
        console.log("[v0] STT error:", e?.error)
      }
      recognitionRef.current = recognition
    } else {
      console.log("[v0] Web Speech API not available for STT.")
    }
    return () => {
      recognitionRef.current?.stop?.()
      recognitionRef.current = null
    }
  }, [sourceLang])

  const toggleRecording = () => {
    if (!recognitionRef.current) return
    if (recording) {
      recognitionRef.current.stop()
      setRecording(false)
    } else {
      setRecognizedText("")
      setTranslatedText("")
      recognitionRef.current.start()
      setRecording(true)
    }
  }

  const handleTranslate = async () => {
    if (!recognizedText.trim()) return
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: recognizedText,
          targetLang,
        }),
      })
      const data = await res.json()
      setTranslatedText(data.translation || "")
    } catch (e) {
      console.log("[v0] translate error:", (e as Error).message)
    }
  }

  const speakOut = () => {
    if (!translatedText) return
    if (!("speechSynthesis" in window)) {
      console.log("[v0] TTS not supported.")
      return
    }
    const utter = new SpeechSynthesisUtterance(translatedText)
    // best-effort: voice selection left default; browser chooses based on locale
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex gap-2 items-center">
          <label className="text-sm">{"Source:"}</label>
          <select
            className="border rounded-md bg-background px-2 py-1"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            aria-label="Source language"
          >
            <option value="auto">{"Auto"}</option>
            <option value="en-US">{"English (US)"}</option>
            <option value="es-ES">{"Spanish"}</option>
            <option value="fr-FR">{"French"}</option>
            <option value="de-DE">{"German"}</option>
            <option value="zh-CN">{"Chinese (Simplified)"}</option>
            <option value="ja-JP">{"Japanese"}</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">{"Target:"}</label>
          <select
            className="border rounded-md bg-background px-2 py-1"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            aria-label="Target language"
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Chinese</option>
            <option>Japanese</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={toggleRecording} variant={recording ? "destructive" : "default"}>
            {recording ? "Stop Recording" : "Start Recording"}
          </Button>
          <Button onClick={handleTranslate} variant="secondary">
            Translate
          </Button>
          <Button onClick={speakOut} variant="secondary">
            Speak
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 rounded-md border">
          <h3 className="font-medium mb-2">{"Recognized Text"}</h3>
          <p className="min-h-24 whitespace-pre-wrap">{recognizedText || "…"}</p>
        </div>
        <div className="p-3 rounded-md border">
          <h3 className="font-medium mb-2">{"Translated"}</h3>
          <p className="min-h-24 whitespace-pre-wrap">{translatedText || "…"}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {"Note: Uses browser STT/TTS for quick demo. You can swap to Hugging Face/Qwen for model-based STT/TTS later."}
      </p>
    </div>
  )
}
