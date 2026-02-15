import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { addColumnSchema } from "@/lib/validators/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { tableId } = await params;
  const body = await req.json();

  const parsed = addColumnSchema.safeParse({ ...body, tableId });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
    include: { columns: true },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  const column = await prisma.column.create({
    data: {
      key: parsed.data.key,
      name: parsed.data.name,
      type: parsed.data.type,
      config: JSON.stringify(parsed.data.config || {}),
      position: table.columns.length,
      tableId,
    },
  });

  return Response.json({ success: true, data: column }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { tableId } = await params;
  const body = await req.json();
  const { columnId } = body;

  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      table: {
        id: tableId,
        project: { workspace: { members: { some: { userId } } } },
      },
    },
  });

  if (!column) {
    return Response.json({ error: "Column not found" }, { status: 404 });
  }

  await prisma.column.delete({ where: { id: columnId } });

  return Response.json({ success: true });
}
