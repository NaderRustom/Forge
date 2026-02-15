import { z } from "zod";

export const createTableSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().min(1),
  columns: z.array(
    z.object({
      key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, "Column key must be snake_case"),
      name: z.string().min(1).max(100),
      type: z.enum(["TEXT", "AI_PROMPT", "TEMPLATE", "LOOKUP_DOMAIN", "WEB_SUMMARY"]).default("TEXT"),
      config: z.record(z.string(), z.unknown()).optional(),
    })
  ),
});

export const importRowsSchema = z.object({
  tableId: z.string().min(1),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
});

export const addColumnSchema = z.object({
  tableId: z.string().min(1),
  key: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/, "Column key must be snake_case"),
  name: z.string().min(1).max(100),
  type: z.enum(["TEXT", "AI_PROMPT", "TEMPLATE", "LOOKUP_DOMAIN", "WEB_SUMMARY"]),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const runColumnSchema = z.object({
  tableId: z.string().min(1),
  columnKey: z.string().min(1),
  rowIds: z.array(z.string()).optional(),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  threadId: z.string().min(1),
  projectId: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workspaceId: z.string().min(1),
});

export const exportTableSchema = z.object({
  tableId: z.string().min(1),
  format: z.enum(["csv", "json"]).default("csv"),
});
