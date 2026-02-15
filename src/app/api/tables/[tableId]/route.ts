import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { tableId } = await params;

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" }, take: 500 },
      _count: { select: { rows: true } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  const parsed = {
    ...table,
    columns: table.columns.map((col) => ({
      ...col,
      config: JSON.parse(col.config as string),
    })),
    rows: table.rows.map((row) => ({
      ...row,
      data: JSON.parse(row.data as string),
    })),
  };

  return Response.json({ success: true, data: parsed });
}

export async function PATCH(
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

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  const updated = await prisma.table.update({
    where: { id: tableId },
    data: { name: body.name },
  });

  return Response.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { tableId } = await params;

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  await prisma.table.delete({ where: { id: tableId } });

  return Response.json({ success: true });
}
