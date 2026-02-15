# Forge — Chat-First GTM Workspace

Build lead lists, enrich data with AI, and automate your go-to-market workflows.

## Features

- **Chat-First Interface** — Control everything through natural language
- **AI Columns** — Enrich rows with AI-powered columns (ICP scoring, personalization, domain lookup)
- **Table Management** — Create, edit, and manage data tables with a spreadsheet-like UI
- **Tool Calling** — Claude executes actions (create tables, import data, run enrichment) via chat
- **Workflows** — Chain multiple steps into reusable workflows
- **CSV Export** — Export enriched data for use in outreach tools

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth (JWT + Credentials)
- **AI:** Anthropic Claude API (tool calling)
- **Jobs:** BullMQ + Redis

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (for background jobs)
- Anthropic API key

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Fill in your `.env` values (database URL, API keys, etc.)
5. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated app pages
│   │   ├── project/        # Project listing & views
│   │   └── settings/       # User settings
│   ├── (auth)/             # Auth pages (login, signup)
│   └── api/                # API routes
│       ├── auth/           # Auth endpoints
│       ├── chat/           # Chat streaming endpoint
│       ├── tables/         # Table CRUD
│       ├── projects/       # Project CRUD
│       ├── workspaces/     # Workspace endpoints
│       ├── runs/           # Run tracking
│       └── export/         # CSV/JSON export
├── components/             # React components
│   ├── chat/               # Chat UI components
│   ├── table/              # Table/spreadsheet components
│   ├── layout/             # Layout components (sidebar, providers)
│   └── ui/                 # Base UI components (button, input)
├── hooks/                  # Custom React hooks
├── lib/                    # Server-side libraries
│   ├── ai/                 # Anthropic client & tool definitions
│   ├── db/                 # Prisma client
│   ├── tools/              # Tool execution logic
│   └── validators/         # Zod schemas & env validation
├── types/                  # TypeScript types
└── prisma/                 # Prisma schema & migrations
```

## Key Concepts

### Tables & Rows
Data is stored as JSONB rows with column definitions. This allows dynamic columns without schema migrations.

### Column Types
- **TEXT** — Plain text data
- **AI_PROMPT** — AI-generated content using a prompt template
- **TEMPLATE** — Deterministic string template from other columns
- **LOOKUP_DOMAIN** — Infer company domain from name
- **WEB_SUMMARY** — Summarize web page content

### Tool Calling
The chat interface uses Claude's tool calling to execute actions:
- `create_table` — Create a new table with columns
- `import_rows` — Import data into a table
- `add_column` — Add a column (including AI columns)
- `run_column` — Execute column logic across rows
- `run_workflow` — Run a multi-step workflow
- `export_table` — Export to CSV/JSON
- `summarize_table` — AI summary of table data
