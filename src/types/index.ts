// ── Column Types ──────────────────────────────────────

export type ColumnType =
  | "TEXT"
  | "AI_PROMPT"
  | "TEMPLATE"
  | "LOOKUP_DOMAIN"
  | "WEB_SUMMARY";

export interface ColumnConfig {
  promptTemplate?: string;
  model?: string;
  outputSchema?: Record<string, unknown>;
  templateString?: string;
}

// ── Tool Types ────────────────────────────────────────

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ── Chat Types ────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: ToolResult;
  createdAt: Date;
}

// ── Workflow Types ────────────────────────────────────

export interface WorkflowStep {
  type: "add_column" | "run_column" | "filter_rows" | "export";
  config: Record<string, unknown>;
}

// ── Run Types ─────────────────────────────────────────

export type RunStatus = "queued" | "running" | "success" | "fail";

// ── Row Data ──────────────────────────────────────────

export type RowData = Record<string, unknown>;

// ── API Response ──────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
