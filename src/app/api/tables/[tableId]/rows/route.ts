import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { tableId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const skip = (page - 1) * limit;

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  const [rows, total] = await Promise.all([
    prisma.row.findMany({
      where: { tableId },
      orderBy: { position: "asc" },
      skip,
      take: limit,
    }),
    prisma.row.count({ where: { tableId } }),
  ]);

  return Response.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

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

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  const count = await prisma.row.count({ where: { tableId } });

  const row = await prisma.row.create({
    data: {
      tableId,
      data: (body.data || {}) as object,
      position: count,
    },
  });

  return Response.json({ success: true, data: row }, { status: 201 });
}

export async function PUT(
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

  const { rowId, data } = body;

  const row = await prisma.row.findFirst({
    where: { id: rowId, tableId },
  });

  if (!row) {
    return Response.json({ error: "Row not found" }, { status: 404 });
  }

  const updated = await prisma.row.update({
    where: { id: rowId },
    data: {
      data: { ...(row.data as Record<string, unknown>), ...data } as object,
    },
  });

  return Response.json({ success: true, data: updated });
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
  const { rowIds } = body as { rowIds: string[] };

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  await prisma.row.deleteMany({
    where: { id: { in: rowIds }, tableId },
  });

  return Response.json({ success: true });
}
