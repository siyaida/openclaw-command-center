"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { Column, type ColumnData } from "./column";
import type { TaskData } from "./task-card";

interface BoardProps {
  boardId: string;
  columns: ColumnData[];
  onColumnsChange: (columns: ColumnData[]) => void;
  onAddTask: (columnId: string, columnTitle: string) => void;
  onTaskClick: (task: TaskData) => void;
}

export function Board({
  boardId,
  columns,
  onColumnsChange,
  onAddTask,
  onTaskClick,
}: BoardProps) {
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
    const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    // Optimistic update
    const newColumns = columns.map((col) => ({
      ...col,
      tasks: [...col.tasks],
    }));

    const [movedTask] = newColumns[sourceColIndex].tasks.splice(source.index, 1);
    if (!movedTask) return;

    movedTask.columnId = destination.droppableId;
    newColumns[destColIndex].tasks.splice(destination.index, 0, movedTask);

    // Update order for all tasks in affected columns
    newColumns[sourceColIndex].tasks.forEach((t, i) => (t.order = i));
    newColumns[destColIndex].tasks.forEach((t, i) => (t.order = i));

    onColumnsChange(newColumns);

    // API call
    try {
      const res = await fetch(`/api/tasks/${draggableId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: destination.droppableId,
          order: destination.index,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        onColumnsChange(columns);
      }
    } catch {
      onColumnsChange(columns);
    }
  }

  async function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    setCreatingColumn(true);

    try {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newColumnTitle.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create column");

      const column = await res.json();
      onColumnsChange([...columns, { ...column, tasks: [] }]);
      setNewColumnTitle("");
      setAddingColumn(false);
    } catch {
      // silently fail
    } finally {
      setCreatingColumn(false);
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
          />
        ))}

        {/* Add Column */}
        <div className="w-72 shrink-0">
          {addingColumn ? (
            <form
              onSubmit={handleAddColumn}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
            >
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Column title"
                autoFocus
                className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creatingColumn || !newColumnTitle.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {creatingColumn && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingColumn(false);
                    setNewColumnTitle("");
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-8 text-sm text-slate-500 transition-colors hover:border-slate-600 hover:bg-slate-900/30 hover:text-slate-400"
            >
              <Plus className="h-4 w-4" />
              Add Column
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}
