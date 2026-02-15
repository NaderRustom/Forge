# Architecture Decisions

## Frontend: Next.js (App Router) + TypeScript + Tailwind
Next.js with the App Router provides server components, streaming, and API routes in a single framework. TypeScript gives us type safety across the stack. Tailwind enables rapid UI development with a consistent design system. This combination allows us to ship fast while maintaining code quality.

## Backend: Next.js API Routes
For MVP, co-locating API routes with the frontend reduces deployment complexity and eliminates CORS issues. API routes handle auth, CRUD operations, and the chat streaming endpoint. We can extract to a separate service later if needed for scale.

## Database: PostgreSQL + Prisma ORM
PostgreSQL with JSONB columns gives us the flexibility to store dynamic row data while keeping relational structure for core entities. Prisma provides type-safe database access, migrations, and an excellent developer experience. JSONB lets us add columns without schema migrations.

## Authentication: NextAuth (Credentials)
NextAuth provides a flexible auth solution with JWT sessions. Starting with credentials-based auth for simplicity. OAuth providers (Google, GitHub) can be added later. JWT strategy avoids the need for session storage.

## AI: Anthropic API (Claude) with Tool Calling
Claude's tool-calling capability is the core of Forge's chat-first experience. The AI can create tables, import data, run enrichments, and chain workflows through natural language. Claude Sonnet provides the best balance of capability and cost for interactive use.

## Jobs: BullMQ + Redis
BullMQ provides reliable job processing for long-running enrichment tasks across many rows. Redis serves as the queue backend. This prevents UI freezes when processing large datasets and provides progress tracking, retries, and failure handling.

## Deployment: Vercel + Neon + Upstash
Vercel handles frontend and API route deployment with excellent Next.js integration. Neon provides serverless Postgres with branching. Upstash provides serverless Redis. This stack minimizes operational overhead while providing production-grade infrastructure.
