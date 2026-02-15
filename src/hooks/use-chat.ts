"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage, ToolResult } from "@/types";
import { nanoid } from "nanoid";

interface UseChatOptions {
  threadId: string;
  projectId: string;
}

interface StreamEvent {
  type: "text" | "tool_start" | "tool_result" | "done" | "error";
  content?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: ToolResult;
  error?: string;
}

export function useChat({ threadId, projectId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: nanoid(),
        role: "user",
        content,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Create placeholder for assistant response
      const assistantId = nanoid();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
      ]);

      try {
        abortRef.current = new AbortController();
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, threadId, projectId }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Chat request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            try {
              const event: StreamEvent = JSON.parse(data);

              switch (event.type) {
                case "text":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + (event.content || "") }
                        : m
                    )
                  );
                  break;

                case "tool_start":
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: nanoid(),
                      role: "tool",
                      content: `Running ${event.name}...`,
                      toolName: event.name,
                      toolInput: event.input,
                      createdAt: new Date(),
                    },
                  ]);
                  break;

                case "tool_result":
                  setMessages((prev) => {
                    const toolMsgIdx = [...prev]
                      .reverse()
                      .findIndex((m) => m.role === "tool" && m.toolName === event.name);
                    if (toolMsgIdx === -1) return prev;
                    const idx = prev.length - 1 - toolMsgIdx;
                    const updated = [...prev];
                    updated[idx] = {
                      ...updated[idx],
                      content: event.result?.success
                        ? `${event.name} completed successfully`
                        : `${event.name} failed: ${event.result?.error}`,
                      toolResult: event.result,
                    };
                    return updated;
                  });
                  break;

                case "error":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: `Error: ${event.error}` }
                        : m
                    )
                  );
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${(error as Error).message}` }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [threadId, projectId, isLoading]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, stop, setMessages };
}
