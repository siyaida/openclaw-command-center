"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Trash2,
  Save,
  Clock,
  User,
  Bot,
} from "lucide-react";
import type { TaskData } from "./task-card";

interface TaskActivity {
  id: string;
  taskId: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface TaskDialogProps {
  task: TaskData;
  onClose: () => void;
  onUpdated: (task: TaskData) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskDialog({ task, onClose, onUpdated, onDeleted }: TaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [assignee, setAssignee] = useState(task.assignee);
  const [labelsText, setLabelsText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    try {
      const parsed = JSON.parse(task.labels);
      setLabelsText(Array.isArray(parsed) ? parsed.join(", ") : "");
    } catch {
      setLabelsText("");
    }

    if (task.dueDate) {
      const d = new Date(task.dueDate);
      setDueDate(d.toISOString().split("T")[0]);
    }

    fetchActivities();
  }, [task]);

  async function fetchActivities() {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingActivities(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const labels = labelsText
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          assignee,
          labels,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      const updated = await res.json();
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete task");

      onDeleted(task.id);
    } catch {
      setError("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Task Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Assignee</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssignee("me")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  assignee === "me"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Me
              </button>
              <button
                type="button"
                onClick={() => setAssignee("openclaw_bot")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  assignee === "openclaw_bot"
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                OpenClaw Bot
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Labels <span className="font-normal text-slate-500">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
              placeholder="bug, feature, urgent"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">Activity</h3>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50">
              {loadingActivities ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                </div>
              ) : activities.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-500">No activity yet</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {activities.map((activity) => (
                    <div key={activity.id} className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="font-medium text-slate-400">{activity.action}</span>
                        <span className="text-slate-600">-</span>
                        <span className="text-slate-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="mt-0.5 text-xs text-slate-500 pl-4">{activity.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
