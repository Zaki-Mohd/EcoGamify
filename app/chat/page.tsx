// app/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import DataTable from "./DataTable";
import DynamicNivoChart from "./DynamicNivoChart"; // Use the new Nivo component
import { motion } from "framer-motion";

// Simplified ChatMessage type
type ChatMessage = {
  role: "user" | "assistant";
  type: "text" | "data" | "chart"; // We only need these 3 types
  // 'content' holds the string for text, or the object for data/chart
  content: string | Record<string, any>[] | { chartSpec: any; data: Record<string, any>[] };
  // 'textContent' is what we'll use for chat history
  textContent: string; 
};

// History type for the API
type ApiHistory = {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  async function sendMessage() {
    if (!message.trim()) return;
    setLoading(true);

    const userMessage: ChatMessage = {
      role: "user",
      type: "text",
      content: message,
      textContent: message,
    };
    
    // Add user message to state immediately
    const newChat = [...chat, userMessage];
    setChat(newChat);
    setMessage("");

    // Map chat state to the simple format for the API
    const historyForApi: ApiHistory[] = newChat
      .slice(0, -1) // Get all messages *except* the new one
      .map((msg) => ({
        role: msg.role,
        content: msg.textContent, // Send only the text content
      }));

    try {
      const res = await fetch("/api/ceea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send new message AND history
        body: JSON.stringify({ message: message, history: historyForApi }), 
      });

      const data = await res.json();

      let botMessage: ChatMessage;

      if (data.type === "data" && Array.isArray(data.data)) {
        botMessage = {
          role: "assistant",
          type: "data",
          content: data.data,
          textContent: data.textSummary || "Here is the data you requested.",
        };
      } else if (data.type === "text") {
        // This handles greetings AND the "Email Sent!" confirmation
        botMessage = {
          role: "assistant",
          type: "text",
          content: data.text,
          textContent: data.text,
        };
      } else if (data.type === "chart" && data.data && data.chartSpec) {
        botMessage = {
          role: "assistant",
          type: "chart",
          content: { chartSpec: data.chartSpec, data: data.data },
          textContent: data.textSummary || "Here is the chart you requested.",
        };
      } else {
        const errorText = data.error || "Sorry, I received an unexpected response.";
        botMessage = {
          role: "assistant",
          type: "text",
          content: errorText,
          textContent: errorText,
        };
      }
      
      // Add the single bot message to the chat
      setChat((prev) => [...prev, botMessage]);

    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        type: "text",
        content: `Error: ${err.message}`,
        textContent: `Error: ${err.message}`,
      };
      setChat((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-4 text-green-400">
        🌿 Eco Dashboard Assistant
      </h1>
      <div className="mb-2 text-sm text-gray-400">
        Ask for data ("top 5 players") or charts ("heatmap of player activity")
      </div>

      <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-lg p-4">
        <div ref={chatContainerRef} className="h-[500px] overflow-y-auto space-y-4 p-2 border border-gray-700 rounded-lg">
          {chat.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-green-600/30 max-w-[85%]"
                    : "bg-gray-700/50 w-full"
                }`}
              >
                {/* Render based on type */}

                {msg.type === "text" && (
                  <div className="whitespace-pre-wrap">
                    {msg.content as string}
                  </div>
                )}

                {msg.type === "data" && (
                  <div>
                    <p className="mb-2 font-semibold">Here's what I found:</p>
                    <DataTable data={msg.content as Record<string, any>[]} />
                  </div>
                )}

                {msg.type === "chart" && (
                  <div>
                    <p className="mb-2 font-semibold">
                      Here's the chart you requested:
                    </p>
                    <DynamicNivoChart
                      chartSpec={(msg.content as any).chartSpec}
                      data={(msg.content as any).data}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="p-3 rounded-lg bg-gray-700/50">
                <p className="text-sm text-gray-400 animate-pulse">
                  Thinking...
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 p-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ask: 'Send email to top player in waste_hack'"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}