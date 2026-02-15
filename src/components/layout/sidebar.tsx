"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  _count?: { tables: number };
}

interface Table {
  id: string;
  name: string;
  _count?: { rows: number };
}

interface SidebarProps {
  projects: Project[];
  currentProjectId?: string;
  tables?: Table[];
  currentTableId?: string;
  workspaceName?: string;
  onCreateProject?: () => void;
}

export function Sidebar({
  projects,
  currentProjectId,
  tables = [],
  currentTableId,
  workspaceName = "Workspace",
  onCreateProject,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-r border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          onClick={() => setCollapsed(false)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">⚡ Forge</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ←
        </button>
      </div>

      {/* Workspace */}
      <div className="px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {workspaceName}
        </span>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Projects
          </span>
          {onCreateProject && (
            <Button variant="ghost" size="sm" onClick={onCreateProject}>
              +
            </Button>
          )}
        </div>

        {projects.map((project) => (
          <div key={project.id} className="mb-1">
            <Link
              href={`/project/${project.id}/chat`}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                project.id === currentProjectId
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="truncate">{project.name}</span>
              {project._count && (
                <span className="text-xs text-zinc-400">{project._count.tables}</span>
              )}
            </Link>

            {/* Tables under current project */}
            {project.id === currentProjectId && tables.length > 0 && (
              <div className="ml-4 mt-1 space-y-0.5">
                {tables.map((table) => (
                  <Link
                    key={table.id}
                    href={`/project/${project.id}/tables/${table.id}`}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                      table.id === currentTableId
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="truncate">📋 {table.name}</span>
                    {table._count && (
                      <span className="text-zinc-400">{table._count.rows}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-zinc-400">
            No projects yet. Create one to get started.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <Link
          href="/settings"
          className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
