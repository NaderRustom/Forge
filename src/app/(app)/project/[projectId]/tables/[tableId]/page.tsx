"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TableView } from "@/components/table/table-view";

interface TableData {
  id: string;
  name: string;
  columns: { id: string; key: string; name: string; type: string }[];
  rows: { id: string; data: Record<string, unknown> }[];
  _count: { rows: number };
}

interface ProjectData {
  id: string;
  name: string;
  workspace: { id: string; name: string };
  tables: {
    id: string;
    name: string;
    _count: { rows: number };
  }[];
}

export default function TablePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const tableId = params.tableId as string;

  const [table, setTable] = useState<TableData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const fetchTable = useCallback(async () => {
    const res = await fetch(`/api/tables/${tableId}`);
    if (res.ok) {
      const data = await res.json();
      setTable(data.data);
    }
  }, [tableId]);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data.data);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTable();
    fetchProject();
  }, [fetchTable, fetchProject]);

  const handleCellEdit = async (rowId: string, columnKey: string, value: string) => {
    await fetch(`/api/tables/${tableId}/rows`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowId, data: { [columnKey]: value } }),
    });
    fetchTable();
  };

  const handleAddRow = async () => {
    await fetch(`/api/tables/${tableId}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    fetchTable();
  };

  const handleDeleteRows = async (rowIds: string[]) => {
    await fetch(`/api/tables/${tableId}/rows`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIds }),
    });
    fetchTable();
  };

  const handleExport = async () => {
    window.open(`/api/export/${tableId}?format=csv`, "_blank");
  };

  if (!table || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      <Sidebar
        projects={[project]}
        currentProjectId={project.id}
        tables={project.tables}
        currentTableId={tableId}
        workspaceName={project.workspace.name}
      />

      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {table.name}
            </h1>
            <p className="text-xs text-zinc-400">
              {table._count.rows} rows · {table.columns.length} columns
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="flex-1">
          <TableView
            tableId={table.id}
            tableName={table.name}
            columns={table.columns}
            rows={table.rows}
            totalRows={table._count.rows}
            onCellEdit={handleCellEdit}
            onAddRow={handleAddRow}
            onDeleteRows={handleDeleteRows}
            onRefresh={fetchTable}
          />
        </div>
      </div>
    </div>
  );
}
