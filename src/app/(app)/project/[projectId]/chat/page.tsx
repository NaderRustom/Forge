"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { nanoid } from "nanoid";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { TableView } from "@/components/table/table-view";

interface ProjectData {
  id: string;
  name: string;
  workspace: { id: string; name: string };
  tables: {
    id: string;
    name: string;
    columns: { id: string; key: string; name: string; type: string }[];
    _count: { rows: number };
  }[];
}

interface TableData {
  id: string;
  name: string;
  columns: { id: string; key: string; name: string; type: string }[];
  rows: { id: string; data: Record<string, unknown> }[];
  _count: { rows: number };
}

export default function ProjectChatPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [threadId] = useState(() => nanoid());
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeTable, setActiveTable] = useState<TableData | null>(null);
  const [showTable, setShowTable] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data.data);
    }
  }, [projectId]);

  const fetchTable = useCallback(async (tableId: string) => {
    const res = await fetch(`/api/tables/${tableId}`);
    if (res.ok) {
      const data = await res.json();
      setActiveTable(data.data);
      setShowTable(true);
    }
  }, []);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleTableUpdate = useCallback(() => {
    fetchProject().then(() => {
      if (activeTable) {
        fetchTable(activeTable.id);
      }
    });
  }, [fetchProject, fetchTable, activeTable]);

  const handleCellEdit = async (rowId: string, columnKey: string, value: string) => {
    if (!activeTable) return;
    await fetch(`/api/tables/${activeTable.id}/rows`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowId, data: { [columnKey]: value } }),
    });
    fetchTable(activeTable.id);
  };

  const handleAddRow = async () => {
    if (!activeTable) return;
    await fetch(`/api/tables/${activeTable.id}/rows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    fetchTable(activeTable.id);
  };

  const handleDeleteRows = async (rowIds: string[]) => {
    if (!activeTable) return;
    await fetch(`/api/tables/${activeTable.id}/rows`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIds }),
    });
    fetchTable(activeTable.id);
  };

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        projects={[project]}
        currentProjectId={project.id}
        tables={project.tables.map((t) => ({
          id: t.id,
          name: t.name,
          _count: { rows: t._count.rows },
        }))}
        workspaceName={project.workspace.name}
      />

      {/* Chat */}
      <div className={`flex-1 ${showTable ? "max-w-[50%]" : ""}`}>
        <ChatPanel
          threadId={threadId}
          projectId={projectId}
          onTableUpdate={handleTableUpdate}
        />
      </div>

      {/* Table Preview */}
      {showTable && activeTable && (
        <div className="flex-1 border-l border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Table Preview
            </span>
            <button
              onClick={() => setShowTable(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Close
            </button>
          </div>
          <TableView
            tableId={activeTable.id}
            tableName={activeTable.name}
            columns={activeTable.columns}
            rows={activeTable.rows}
            totalRows={activeTable._count.rows}
            onCellEdit={handleCellEdit}
            onAddRow={handleAddRow}
            onDeleteRows={handleDeleteRows}
            onRefresh={() => fetchTable(activeTable.id)}
          />
        </div>
      )}

      {/* Table toggle button if tables exist but panel is hidden */}
      {!showTable && project.tables.length > 0 && (
        <button
          onClick={() => {
            const firstTable = project.tables[0];
            fetchTable(firstTable.id);
          }}
          className="fixed bottom-4 right-4 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          View Table
        </button>
      )}
    </div>
  );
}
