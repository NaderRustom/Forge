import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { anthropic } from "@/lib/ai/client";
import { forgeTools } from "@/lib/ai/tools-definition";
import { executeTool } from "@/lib/tools";
import { chatMessageSchema } from "@/lib/validators/schemas";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { content, threadId, projectId } = parsed.data;

  // Verify project access
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: { members: { some: { userId } } },
    },
    include: { workspace: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Get or create thread
  let thread = await prisma.chatThread.findFirst({
    where: { id: threadId, projectId },
  });

  if (!thread) {
    thread = await prisma.chatThread.create({
      data: { id: threadId, projectId },
    });
  }

  // Save user message
  await prisma.message.create({
    data: {
      role: "user",
      content,
      threadId,
      userId,
    },
  });

  // Get conversation history
  const history = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  // Build messages for Claude
  const messages = history.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  // Get table context for the project
  const tables = await prisma.table.findMany({
    where: { projectId },
    include: {
      columns: { orderBy: { position: "asc" } },
      _count: { select: { rows: true } },
    },
  });

  const tableContext = tables.length
    ? `Current tables in this project:\n${tables
        .map(
          (t) =>
            `- ${t.name} (id: ${t.id}): ${t.columns.map((c) => c.name).join(", ")} — ${t._count.rows} rows`
        )
        .join("\n")}`
    : "No tables exist yet in this project.";

  const systemPrompt = `You are Forge, a chat-first GTM (go-to-market) workspace assistant. You help users build lead lists, enrich data, run AI columns, and automate sales workflows.

You have access to tools that let you create tables, import data, add columns (including AI-powered ones), run enrichment, and export results. Use these tools when the user asks you to perform actions.

${tableContext}

Project: ${project.name} (id: ${project.id})
Workspace: ${project.workspace.name} (id: ${project.workspace.id})

Guidelines:
- Be concise and action-oriented
- When the user wants to create a table, use the create_table tool
- When they want to add data, use import_rows
- When they want AI enrichment, add an AI_PROMPT column and then run it
- For column keys, always use snake_case
- Always confirm what you did after using a tool`;

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages = messages;
        let continueLoop = true;

        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: systemPrompt,
            tools: forgeTools,
            messages: currentMessages,
          });

          let assistantText = "";
          const toolUses: { id: string; name: string; input: Record<string, unknown> }[] = [];

          for (const block of response.content) {
            if (block.type === "text") {
              assistantText += block.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: block.text })}\n\n`
                )
              );
            } else if (block.type === "tool_use") {
              toolUses.push({
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
              });
            }
          }

          // Save assistant message
          if (assistantText) {
            await prisma.message.create({
              data: {
                role: "assistant",
                content: assistantText,
                threadId,
              },
            });
          }

          if (toolUses.length === 0) {
            continueLoop = false;
            break;
          }

          // Execute tools and build tool results
          const toolResults = [];
          for (const tool of toolUses) {
            // Notify client about tool execution
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tool_start", name: tool.name, input: tool.input })}\n\n`
              )
            );

            const result = await executeTool(tool.name, tool.input, {
              projectId,
              userId,
              workspaceId: project.workspaceId,
            });

            // Save tool message
            await prisma.message.create({
              data: {
                role: "tool",
                content: JSON.stringify(result),
                toolName: tool.name,
                toolInput: tool.input as object,
                toolResult: result as object,
                threadId,
                userId,
              },
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tool_result", name: tool.name, result })}\n\n`
              )
            );

            toolResults.push({
              type: "tool_result" as const,
              tool_use_id: tool.id,
              content: JSON.stringify(result),
            });
          }

          // Continue conversation with tool results
          currentMessages = [
            ...currentMessages,
            { role: "assistant" as const, content: response.content as unknown as string },
            { role: "user" as const, content: toolResults as unknown as string },
          ];
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
