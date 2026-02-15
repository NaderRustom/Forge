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
  const format = req.nextUrl.searchParams.get("format") || "csv";

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      project: { workspace: { members: { some: { userId } } } },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
      rows: { orderBy: { position: "asc" } },
    },
  });

  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }

  if (format === "json") {
    const data = table.rows.map((row) => {
      const rowData = JSON.parse(row.data as string) as Record<string, unknown>;
      const obj: Record<string, unknown> = {};
      for (const col of table.columns) {
        obj[col.name] = rowData[col.key] ?? "";
      }
      return obj;
    });

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${table.name}.json"`,
      },
    });
  }

  // CSV export
  const header = table.columns.map((c) => c.name).join(",");
  const csvRows = table.rows.map((row) => {
    const rowData = JSON.parse(row.data as string) as Record<string, unknown>;
    return table.columns
      .map((col) => {
        const val = String(rowData[col.key] ?? "");
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      })
      .join(",");
  });

  const csv = [header, ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${table.name}.csv"`,
    },
  });
}
