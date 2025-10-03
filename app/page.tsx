"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import SpeakTab from "@/components/translator/speak-tab"
import ScanTab from "@/components/translator/scan-tab"
import PromptTab from "@/components/translator/prompt-tab"
import ChatTab from "@/components/translator/chat-tab"

const TABS = [
  { id: "speak", label: "Speak" },
  { id: "scan", label: "Scan" },
  { id: "prompt", label: "Prompt" },
  { id: "chat", label: "Chat" },
] as const

export default function HomePage() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("speak")

  return (
    <main className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-pretty text-2xl md:text-3xl font-semibold">{"🌍 Universal Translator"}</h1>
          <nav aria-label="Modes" className="flex gap-2">
            {TABS.map((t) => (
              <Button
                key={t.id}
                variant={active === t.id ? "default" : "secondary"}
                onClick={() => setActive(t.id)}
                aria-pressed={active === t.id}
                aria-label={`Switch to ${t.label} tab`}
              >
                {t.label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-muted-foreground mb-6">
          {"Translate across voice, text, and images — then chat in your chosen language."}
        </p>

        <div role="tabpanel" aria-live="polite" className={cn("rounded-lg border")}>
          {active === "speak" && <SpeakTab />}
          {active === "scan" && <ScanTab />}
          {active === "prompt" && <PromptTab />}
          {active === "chat" && <ChatTab />}
        </div>
      </section>
    </main>
  )
}
