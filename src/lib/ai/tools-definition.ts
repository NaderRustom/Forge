import Anthropic from "@anthropic-ai/sdk";

export const forgeTools: Anthropic.Tool[] = [
  {
    name: "create_table",
    description:
      "Create a new table in the current project with specified columns.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name of the table",
        },
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string", description: "Column key (snake_case)" },
              name: { type: "string", description: "Display name" },
              type: {
                type: "string",
                enum: [
                  "TEXT",
                  "AI_PROMPT",
                  "TEMPLATE",
                  "LOOKUP_DOMAIN",
                  "WEB_SUMMARY",
                ],
                description: "Column type",
              },
            },
            required: ["key", "name"],
          },
          description: "Array of column definitions",
        },
      },
      required: ["name", "columns"],
    },
  },
  {
    name: "import_rows",
    description:
      "Import rows of data into an existing table. Each row is an object mapping column keys to values.",
    input_schema: {
      type: "object" as const,
      properties: {
        tableId: {
          type: "string",
          description: "ID of the table to import rows into",
        },
        rows: {
          type: "array",
          items: {
            type: "object",
            description:
              "Row data as key-value pairs matching table column keys",
          },
          description: "Array of row data objects",
        },
      },
      required: ["tableId", "rows"],
    },
  },
  {
    name: "add_column",
    description:
      "Add a new column to an existing table. Supports TEXT, AI_PROMPT, TEMPLATE, LOOKUP_DOMAIN types.",
    input_schema: {
      type: "object" as const,
      properties: {
        tableId: {
          type: "string",
          description: "ID of the table",
        },
        key: {
          type: "string",
          description: "Column key (snake_case identifier)",
        },
        name: {
          type: "string",
          description: "Display name for the column",
        },
        type: {
          type: "string",
          enum: [
            "TEXT",
            "AI_PROMPT",
            "TEMPLATE",
            "LOOKUP_DOMAIN",
            "WEB_SUMMARY",
          ],
          description: "Column type",
        },
        config: {
          type: "object",
          description:
            "Column config. For AI_PROMPT: { promptTemplate: string }. For TEMPLATE: { templateString: string }.",
          properties: {
            promptTemplate: { type: "string" },
            templateString: { type: "string" },
            model: { type: "string" },
          },
        },
      },
      required: ["tableId", "key", "name", "type"],
    },
  },
  {
    name: "run_column",
    description:
      "Execute a column's logic (e.g., run AI prompt) across all or selected rows in a table.",
    input_schema: {
      type: "object" as const,
      properties: {
        tableId: {
          type: "string",
          description: "ID of the table",
        },
        columnKey: {
          type: "string",
          description: "Key of the column to run",
        },
        rowIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional: specific row IDs to run on. If omitted, runs on all rows.",
        },
      },
      required: ["tableId", "columnKey"],
    },
  },
  {
    name: "run_workflow",
    description:
      "Execute a sequence of steps (workflow) on a table. Steps can include adding columns, running enrichment, filtering, and exporting.",
    input_schema: {
      type: "object" as const,
      properties: {
        tableId: {
          type: "string",
          description: "ID of the table to run the workflow on",
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["add_column", "run_column", "filter_rows", "export"],
              },
              config: {
                type: "object",
                description: "Configuration for this step",
              },
            },
            required: ["type", "config"],
          },
          description: "Array of workflow steps to execute in order",
        },
        workflowName: {
          type: "string",
          description:
            "Optional name to save this workflow for future reuse",
        },
      },
      required: ["tableId", "steps"],
    },
  },
  {
    name: "export_table",
    description: "Export a table's data to CSV format.",
    input_schema: {
      type: "object" as const,
      properties: {
        tableId: {
          type: "string",
          description: "ID of the table to export",
        },
        format: {
          type: "string",
          enum: ["csv", "json"],
          description: "Export format",
        },
      },
      required: ["tableId"],
    },
  },
  {
    name: "summarize_table",
    description:
      "Generate an AI summary of a table's data based on given instructions.",
    input_schema: {
      type: "object" as const,
      properties: {
        tableId: {
          type: "string",
          description: "ID of the table to summarize",
        },
        instructions: {
          type: "string",
          description:
            "What kind of summary you want (e.g., 'top 10 by fit score', 'group by region')",
        },
      },
      required: ["tableId"],
    },
  },
];
