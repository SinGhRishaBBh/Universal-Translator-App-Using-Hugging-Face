"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type Message = { role: "user" | "assistant"; content: string }

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [targetLang, setTargetLang] = useState("English")
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text) return
    const nextMsgs = [...messages, { role: "user", content: text }]
    setMessages(nextMsgs)
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, targetLang }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "" }])
    } catch (e) {
      console.log("[v0] chat error:", (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm">{"Respond in:"}</label>
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
        </div>
      </div>

      <div className="rounded-md border p-3 min-h-64 max-h-[50vh] overflow-auto flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{"Ask contextual questions, e.g., 'Which items are vegan?'"}</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[85%]"}>
              <div
                className={
                  m.role === "user"
                    ? "bg-primary text-primary-foreground px-3 py-2 rounded-lg"
                    : "bg-secondary text-secondary-foreground px-3 py-2 rounded-lg"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded-md bg-background px-3 py-2 w-full"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          aria-label="Chat message"
        />
        <Button onClick={send} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  )
}
