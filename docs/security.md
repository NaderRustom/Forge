# Security Notes

## Authentication
- Passwords are hashed with bcrypt (12 rounds) before storage
- JWT tokens are used for session management via NextAuth
- Sessions expire and require re-authentication

## Authorization
- All API routes verify authentication via getServerSession
- Workspace-level scoping: users can only access resources in their workspaces
- Row-level access control enforced via Prisma queries (workspace membership checks)

## Data Protection
- Provider credentials are stored as encrypted JSON in the database
- Environment variables contain sensitive configuration (API keys, DB URLs)
- No secrets are exposed to the client bundle (all API keys are server-side only)

## Input Validation
- All API inputs are validated with Zod schemas before processing
- SQL injection is prevented by Prisma's parameterized queries
- XSS is mitigated by React's default escaping and strict CSP headers

## PII Handling
- User data (lead lists) may contain PII (names, emails, company info)
- Data is stored in workspace-scoped tables with access controls
- Export functionality respects workspace permissions
- AI processing sends row data to Anthropic API — users should be informed

## Audit Logging
- All tool executions and data mutations are logged in the AuditLog table
- Logs include: action, entity, user, workspace, timestamp, and metadata
