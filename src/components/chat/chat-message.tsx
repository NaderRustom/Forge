"use client";

import { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "tool") {
    return <ToolMessage message={message} />;
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content || (
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <LoadingDots />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolMessage({ message }: { message: ChatMessageType }) {
  const isSuccess = message.toolResult?.success;
  const data = message.toolResult?.data as Record<string, unknown> | undefined;

  return (
    <div className="flex justify-center">
      <div
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
          isSuccess
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            : message.toolResult
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
              : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        <span className="font-medium">
          {isSuccess ? "✓" : message.toolResult ? "✗" : "⟳"}{" "}
          {message.toolName}
        </span>
        {data && "tableId" in data && (
          <span className="text-zinc-400">• Table {String(data.tableId).slice(0, 8)}</span>
        )}
        {data && "imported" in data && (
          <span>• {String(data.imported)} rows imported</span>
        )}
        {data && "processed" in data && (
          <span>
            • {String(data.processed)}/{String(data.total)} processed
          </span>
        )}
        {data && "rowCount" in data && (
          <span>• {String(data.rowCount)} rows exported</span>
        )}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
