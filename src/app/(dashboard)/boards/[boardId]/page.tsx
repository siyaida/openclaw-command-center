"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Pencil, Check, X } from "lucide-react";
import { Board } from "@/components/kanban/board";
import type { ColumnData } from "@/components/kanban/column";
import type { TaskData } from "@/components/kanban/task-card";
import { CreateTaskDialog } from "@/components/kanban/create-task-dialog";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { CommandCenterPanel } from "@/components/command-center/panel";

interface BoardData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  columns: ColumnData[];
}

export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const router = useRouter();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Dialog state
  const [createTaskTarget, setCreateTaskTarget] = useState<{
    columnId: string;
    columnTitle: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  async function fetchBoard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Board not found");
          return;
        }
        throw new Error("Failed to fetch board");
      }
      const data = await res.json();
      setBoard(data);
      setTitleInput(data.title);
    } catch {
      setError("Failed to load board");
    } finally {
      setLoading(false);
    }
  }

  async function handleTitleSave() {
    if (!board || !titleInput.trim() || titleInput.trim() === board.title) {
      setEditingTitle(false);
      setTitleInput(board?.title || "");
      return;
    }

    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBoard((prev) => prev ? { ...prev, title: updated.title } : prev);
      }
    } catch {
      setTitleInput(board.title);
    } finally {
      setEditingTitle(false);
    }
  }

  function handleColumnsChange(newColumns: ColumnData[]) {
    setBoard((prev) => prev ? { ...prev, columns: newColumns } : prev);
  }

  function handleTaskCreated(task: Record<string, unknown>) {
    if (!board || !createTaskTarget) return;

    const newColumns = board.columns.map((col) => {
      if (col.id === createTaskTarget.columnId) {
        return { ...col, tasks: [...col.tasks, task as unknown as TaskData] };
      }
      return col;
    });

    setBoard({ ...board, columns: newColumns });
    setCreateTaskTarget(null);
  }

  function handleTaskUpdated(updatedTask: TaskData) {
    if (!board) return;

    const newColumns = board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
    }));

    setBoard({ ...board, columns: newColumns });
    setSelectedTask(null);
  }

  function handleTaskDeleted(taskId: string) {
    if (!board) return;

    const newColumns = board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
    }));

    setBoard({ ...board, columns: newColumns });
    setSelectedTask(null);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-slate-400">{error || "Board not found"}</p>
        <button
          onClick={() => router.push("/boards")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Boards
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Board area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Board header */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-3">
          <button
            onClick={() => router.push("/boards")}
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitleInput(board.title);
                  }
                }}
                autoFocus
                className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-lg font-bold text-slate-100 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleTitleSave}
                className="rounded p-1 text-green-400 hover:bg-slate-800"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditingTitle(false);
                  setTitleInput(board.title);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-2"
            >
              <h1 className="text-lg font-bold text-slate-100">{board.title}</h1>
              <Pencil className="h-3.5 w-3.5 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Board content */}
        <div className="flex-1 overflow-x-auto p-6">
          <Board
            boardId={board.id}
            columns={board.columns}
            onColumnsChange={handleColumnsChange}
            onAddTask={(columnId, columnTitle) =>
              setCreateTaskTarget({ columnId, columnTitle })
            }
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </div>
      </div>

      {/* Command Center Panel */}
      <CommandCenterPanel
        collapsed={panelCollapsed}
        onToggle={() => setPanelCollapsed(!panelCollapsed)}
      />

      {/* Create Task Dialog */}
      {createTaskTarget && (
        <CreateTaskDialog
          boardId={board.id}
          columnId={createTaskTarget.columnId}
          columnTitle={createTaskTarget.columnTitle}
          onClose={() => setCreateTaskTarget(null)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
