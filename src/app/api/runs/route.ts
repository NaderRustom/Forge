import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const searchParams = req.nextUrl.searchParams;
  const tableId = searchParams.get("tableId");

  if (!tableId) {
    return Response.json({ error: "tableId is required" }, { status: 400 });
  }

  // Verify table access
  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  const runs = await prisma.run.findMany({
    where: { tableId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json({ success: true, data: runs });
}
