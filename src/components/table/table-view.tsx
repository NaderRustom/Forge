"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Column {
  id: string;
  key: string;
  name: string;
  type: string;
}

interface Row {
  id: string;
  data: Record<string, unknown>;
}

interface TableViewProps {
  tableId: string;
  tableName: string;
  columns: Column[];
  rows: Row[];
  totalRows: number;
  onCellEdit?: (rowId: string, columnKey: string, value: string) => void;
  onAddRow?: () => void;
  onDeleteRows?: (rowIds: string[]) => void;
  onRefresh?: () => void;
}

export function TableView({
  tableName,
  columns,
  rows,
  totalRows,
  onCellEdit,
  onAddRow,
  onDeleteRows,
  onRefresh,
}: TableViewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const toggleRow = useCallback((rowId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((r) => r.id)));
    }
  }, [rows, selectedRows.size]);

  const startEdit = (rowId: string, colKey: string, currentValue: unknown) => {
    setEditingCell({ rowId, colKey });
    setEditValue(String(currentValue ?? ""));
  };

  const commitEdit = () => {
    if (editingCell && onCellEdit) {
      onCellEdit(editingCell.rowId, editingCell.colKey, editValue);
    }
    setEditingCell(null);
  };

  const columnTypeColors: Record<string, string> = {
    TEXT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    AI_PROMPT: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    TEMPLATE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    LOOKUP_DOMAIN: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    WEB_SUMMARY: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{tableName}</h3>
          <span className="text-xs text-zinc-400">
            {totalRows} row{totalRows !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && onDeleteRows && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDeleteRows(Array.from(selectedRows));
                setSelectedRows(new Set());
              }}
            >
              Delete ({selectedRows.size})
            </Button>
          )}
          {onAddRow && (
            <Button variant="secondary" size="sm" onClick={onAddRow}>
              + Add Row
            </Button>
          )}
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {columns.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No columns yet. Use chat to create a table.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="w-10 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="border-b border-zinc-200 px-3 py-2 text-left font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    <div className="flex items-center gap-2">
                      <span>{col.name}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${columnTypeColors[col.type] || columnTypeColors.TEXT}`}
                      >
                        {col.type}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                    selectedRows.has(row.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="rounded"
                    />
                  </td>
                  {columns.map((col) => {
                    const isEditing =
                      editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                    const value = row.data[col.key];

                    return (
                      <td
                        key={col.id}
                        className="px-3 py-2 text-zinc-700 dark:text-zinc-300"
                        onDoubleClick={() => startEdit(row.id, col.key, value)}
                      >
                        {isEditing ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            className="w-full rounded border border-blue-400 bg-white px-1 py-0.5 text-sm focus:outline-none dark:bg-zinc-900"
                            autoFocus
                          />
                        ) : (
                          <span className="block max-w-xs truncate">
                            {value != null ? String(value) : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-3 py-8 text-center text-zinc-400"
                  >
                    No rows yet. Import data via chat or click &quot;Add Row&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
