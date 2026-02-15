"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface ChatPanelProps {
  threadId: string;
  projectId: string;
  onTableUpdate?: () => void;
}

export function ChatPanel({ threadId, projectId, onTableUpdate }: ChatPanelProps) {
  const { messages, isLoading, sendMessage, stop } = useChat({
    threadId,
    projectId,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Trigger table refresh when a tool completes
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "tool" && lastMsg.toolResult?.success) {
      onTableUpdate?.();
    }
  }, [messages, onTableUpdate]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} onStop={stop} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 text-4xl">⚡</div>
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Welcome to Forge
      </h2>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Build lead lists, enrich data with AI, and automate your GTM workflows.
        Start by telling me what you&apos;d like to do.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          "Create a table called Leads with columns: company, website, region",
          "Import 10 sample companies",
          "Add an AI column for ICP scoring",
          "Export my table to CSV",
        ].map((prompt) => (
          <div
            key={prompt}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
          >
            &quot;{prompt}&quot;
          </div>
        ))}
      </div>
    </div>
  );
}
