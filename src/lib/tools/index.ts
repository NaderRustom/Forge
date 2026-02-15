import { prisma } from "@/lib/db/prisma";
import { ToolResult } from "@/types";
import { executeColumnRun } from "./run-column";

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  try {
    switch (name) {
      case "create_table":
        return await createTable(input, context);
      case "import_rows":
        return await importRows(input, context);
      case "add_column":
        return await addColumn(input, context);
      case "run_column":
        return await runColumn(input, context);
      case "run_workflow":
        return await runWorkflow(input, context);
      case "export_table":
        return await exportTable(input, context);
      case "summarize_table":
        return await summarizeTable(input, context);
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

async function createTable(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { name, columns } = input as {
    name: string;
    columns: { key: string; name: string; type?: string; config?: Record<string, unknown> }[];
  };

  const table = await prisma.table.create({
    data: {
      name,
      projectId: context.projectId,
      columns: {
        create: columns.map((col, i) => ({
          key: col.key,
          name: col.name,
          type: col.type || "TEXT",
          config: (col.config || {}) as object,
          position: i,
        })),
      },
    },
    include: { columns: true },
  });

  await logAudit("create_table", "Table", table.id, context);

  return {
    success: true,
    data: {
      tableId: table.id,
      name: table.name,
      columns: table.columns.map((c) => ({ key: c.key, name: c.name, type: c.type })),
    },
  };
}

async function importRows(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { tableId, rows } = input as {
    tableId: string;
    rows: Record<string, unknown>[];
  };

  const table = await prisma.table.findFirst({
    where: { id: tableId, project: { workspaceId: context.workspaceId } },
  });
  if (!table) return { success: false, error: "Table not found" };

  const existingCount = await prisma.row.count({ where: { tableId } });

  const created = await prisma.row.createMany({
    data: rows.map((data, i) => ({
      tableId,
      data: data as object,
      position: existingCount + i,
    })),
  });

  await logAudit("import_rows", "Table", tableId, context, { rowCount: created.count });

  return {
    success: true,
    data: { imported: created.count, tableId },
  };
}

async function addColumn(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { tableId, key, name, type, config } = input as {
    tableId: string;
    key: string;
    name: string;
    type: string;
    config?: Record<string, unknown>;
  };

  const table = await prisma.table.findFirst({
    where: { id: tableId, project: { workspaceId: context.workspaceId } },
    include: { columns: true },
  });
  if (!table) return { success: false, error: "Table not found" };

  const column = await prisma.column.create({
    data: {
      key,
      name,
      type,
      config: (config || {}) as object,
      position: table.columns.length,
      tableId,
    },
  });

  await logAudit("add_column", "Column", column.id, context);

  return {
    success: true,
    data: { columnId: column.id, key: column.key, name: column.name, type: column.type },
  };
}

async function runColumn(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { tableId, columnKey, rowIds } = input as {
    tableId: string;
    columnKey: string;
    rowIds?: string[];
  };

  return executeColumnRun(tableId, columnKey, rowIds, context);
}

async function runWorkflow(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { tableId, steps, workflowName } = input as {
    tableId: string;
    steps: { type: string; config: Record<string, unknown> }[];
    workflowName?: string;
  };

  // Save workflow if name provided
  if (workflowName) {
    await prisma.workflow.create({
      data: {
        name: workflowName,
        steps: steps as object[],
        projectId: context.projectId,
      },
    });
  }

  const results: ToolResult[] = [];

  for (const step of steps) {
    const result = await executeTool(step.type, { tableId, ...step.config }, context);
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        error: `Workflow failed at step ${step.type}: ${result.error}`,
        data: { completedSteps: results.length - 1, results },
      };
    }
  }

  await logAudit("run_workflow", "Workflow", tableId, context, { stepCount: steps.length });

  return {
    success: true,
    data: { stepsCompleted: results.length, results },
  };
}

async function exportTable(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { tableId, format = "csv" } = input as {
    tableId: string;
    format?: string;
  };

  const table = await prisma.table.findFirst({
    where: { id: tableId, project: { workspaceId: context.workspaceId } },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" } },
    },
  });

  if (!table) return { success: false, error: "Table not found" };

  const columns = table.columns;
  const rows = table.rows;

  if (format === "json") {
    const data = rows.map((row) => {
      const rowData = row.data as Record<string, unknown>;
      const obj: Record<string, unknown> = {};
      for (const col of columns) {
        obj[col.name] = rowData[col.key] ?? "";
      }
      return obj;
    });
    return { success: true, data: { format: "json", content: data, rowCount: rows.length } };
  }

  // CSV format
  const header = columns.map((c) => c.name).join(",");
  const csvRows = rows.map((row) => {
    const rowData = row.data as Record<string, unknown>;
    return columns
      .map((col) => {
        const val = String(rowData[col.key] ?? "");
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      })
      .join(",");
  });
  const csv = [header, ...csvRows].join("\n");

  await logAudit("export_table", "Table", tableId, context);

  return { success: true, data: { format: "csv", content: csv, rowCount: rows.length } };
}

async function summarizeTable(
  input: Record<string, unknown>,
  context: { projectId: string; userId: string; workspaceId: string }
): Promise<ToolResult> {
  const { tableId, instructions } = input as {
    tableId: string;
    instructions: string;
  };

  const table = await prisma.table.findFirst({
    where: { id: tableId, project: { workspaceId: context.workspaceId } },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" }, take: 100 },
    },
  });

  if (!table) return { success: false, error: "Table not found" };

  const { anthropic } = await import("@/lib/ai/client");

  const tableData = table.rows.map((row) => row.data);
  const columnNames = table.columns.map((c) => `${c.name} (${c.key})`).join(", ");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are analyzing a table called "${table.name}" with columns: ${columnNames}.

Here are the rows (up to 100):
${JSON.stringify(tableData, null, 2)}

Instructions: ${instructions}

Provide a clear, structured summary.`,
      },
    ],
  });

  const summary =
    response.content[0].type === "text" ? response.content[0].text : "";

  return { success: true, data: { summary, rowsAnalyzed: table.rows.length } };
}

async function logAudit(
  action: string,
  entity: string,
  entityId: string,
  context: { userId: string; workspaceId: string },
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      metadata: (metadata || {}) as object,
      userId: context.userId,
      workspaceId: context.workspaceId,
    },
  });
}
