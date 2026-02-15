"use client";

import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, User, Bot, Calendar } from "lucide-react";

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  labels: string;
  dueDate: string | null;
  assignee: string;
  columnId: string;
  order: number;
  openclawJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: TaskData;
  index: number;
  onClick: (task: TaskData) => void;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-green-500/10 text-green-400 ring-green-500/20", label: "Low" },
  medium: { color: "bg-amber-500/10 text-amber-400 ring-amber-500/20", label: "Med" },
  high: { color: "bg-red-500/10 text-red-400 ring-red-500/20", label: "High" },
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  let labels: string[] = [];
  try {
    labels = JSON.parse(task.labels);
  } catch {
    labels = [];
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onClick(task)}
          className={`group cursor-pointer rounded-lg border p-3 transition-all ${
            snapshot.isDragging
              ? "border-blue-500 bg-slate-800 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20"
              : "border-slate-700/50 bg-slate-800/80 hover:border-slate-600 hover:bg-slate-800"
          }`}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-200 leading-snug">{task.title}</p>
            <div
              {...provided.dragHandleProps}
              className="mt-0.5 shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${priority.color}`}
            >
              {priority.label}
            </span>

            {task.assignee === "openclaw_bot" ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-400 ring-1 ring-purple-500/20">
                <Bot className="h-2.5 w-2.5" />
                Bot
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 ring-1 ring-blue-500/20">
                <User className="h-2.5 w-2.5" />
                Me
              </span>
            )}

            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400"
              >
                {label}
              </span>
            ))}

            {task.dueDate && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
