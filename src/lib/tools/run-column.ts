import { prisma } from "@/lib/db/prisma";
import { anthropic } from "@/lib/ai/client";
import { ToolResult } from "@/types";

export async function executeColumnRun(
  tableId: string,
  columnKey: string,
  rowIds: string[] | undefined,
  context: { workspaceId: string }
): Promise<ToolResult> {
  const column = await prisma.column.findFirst({
    where: { tableId, key: columnKey },
  });
  if (!column) return { success: false, error: `Column '${columnKey}' not found` };

  const table = await prisma.table.findFirst({
    where: { id: tableId, project: { workspaceId: context.workspaceId } },
    include: { columns: { orderBy: { position: "asc" } } },
  });
  if (!table) return { success: false, error: "Table not found" };

  const rowWhere: { tableId: string; id?: { in: string[] } } = { tableId };
  if (rowIds?.length) {
    rowWhere.id = { in: rowIds };
  }
  const rows = await prisma.row.findMany({ where: rowWhere, orderBy: { position: "asc" } });

  if (rows.length === 0) {
    return { success: false, error: "No rows to process" };
  }

  // Create run record
  const run = await prisma.run.create({
    data: {
      type: "column_run",
      status: "running",
      config: JSON.stringify({ columnKey, tableId }),
      totalRows: rows.length,
      tableId,
    },
  });

  const columnConfig = JSON.parse(column.config as string) as Record<string, unknown>;
  let processed = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const rowData = JSON.parse(row.data as string) as Record<string, unknown>;
      let result: string;

      switch (column.type) {
        case "AI_PROMPT": {
          result = await runAiPrompt(columnConfig, rowData, table.columns);
          break;
        }
        case "TEMPLATE": {
          result = runTemplate(columnConfig, rowData);
          break;
        }
        case "LOOKUP_DOMAIN": {
          result = await lookupDomain(rowData);
          break;
        }
        default: {
          continue; // TEXT columns don't need processing
        }
      }

      // Write result back to row
      await prisma.row.update({
        where: { id: row.id },
        data: {
          data: JSON.stringify({ ...rowData, [columnKey]: result }),
        },
      });

      processed++;
    } catch (err) {
      errors++;
      const rowData = JSON.parse(row.data as string) as Record<string, unknown>;
      await prisma.row.update({
        where: { id: row.id },
        data: {
          data: JSON.stringify({
            ...rowData,
            [`${columnKey}_error`]: err instanceof Error ? err.message : "Failed",
          }),
        },
      });
    }

    // Update run progress
    await prisma.run.update({
      where: { id: run.id },
      data: {
        doneRows: processed + errors,
        progress: Math.round(((processed + errors) / rows.length) * 100),
      },
    });
  }

  // Finalize run
  await prisma.run.update({
    where: { id: run.id },
    data: {
      status: errors === rows.length ? "fail" : "success",
      doneRows: processed + errors,
      progress: 100,
      result: JSON.stringify({ processed, errors }),
    },
  });

  return {
    success: true,
    data: {
      runId: run.id,
      processed,
      errors,
      total: rows.length,
    },
  };
}

async function runAiPrompt(
  config: Record<string, unknown>,
  rowData: Record<string, unknown>,
  columns: { key: string; name: string }[]
): Promise<string> {
  const template = (config.promptTemplate as string) || "";

  // Replace {{column_key}} placeholders with row values
  let prompt = template;
  for (const col of columns) {
    const val = String(rowData[col.key] ?? "");
    prompt = prompt.replace(new RegExp(`\\{\\{${col.key}\\}\\}`, "g"), val);
  }

  // Also provide full row context
  const rowContext = columns
    .map((col) => `${col.name}: ${rowData[col.key] ?? "N/A"}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: (config.model as string) || "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nRow data:\n${rowContext}\n\nProvide only the result, no explanation.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

function runTemplate(
  config: Record<string, unknown>,
  rowData: Record<string, unknown>
): string {
  let template = (config.templateString as string) || "";
  for (const [key, val] of Object.entries(rowData)) {
    template = template.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(val ?? ""));
  }
  return template;
}

async function lookupDomain(rowData: Record<string, unknown>): Promise<string> {
  // Try to infer domain from company name using AI
  const company =
    (rowData.company as string) ||
    (rowData.company_name as string) ||
    (rowData.name as string) ||
    "";

  if (!company) return "";

  // If website/domain already exists, extract domain
  const existingWebsite = (rowData.website as string) || (rowData.domain as string) || "";
  if (existingWebsite) {
    try {
      const url = existingWebsite.startsWith("http")
        ? existingWebsite
        : `https://${existingWebsite}`;
      return new URL(url).hostname;
    } catch {
      return existingWebsite;
    }
  }

  // Use AI to infer likely domain
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `What is the most likely website domain for the company "${company}"? Respond with ONLY the domain (e.g., "example.com"), nothing else. If unsure, respond with "unknown".`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text.trim() : "";
}
