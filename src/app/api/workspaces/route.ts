import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createProjectSchema } from "@/lib/validators/schemas";

// GET /api/workspaces — get user's workspaces with projects
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { tables: true } },
        },
      },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  return Response.json({ success: true, data: workspaces });
}

// POST /api/workspaces — create a project in a workspace
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify workspace membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: parsed.data.workspaceId,
      },
    },
  });

  if (!membership) {
    return Response.json({ error: "Not a workspace member" }, { status: 403 });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      workspaceId: parsed.data.workspaceId,
    },
  });

  return Response.json({ success: true, data: project }, { status: 201 });
}
