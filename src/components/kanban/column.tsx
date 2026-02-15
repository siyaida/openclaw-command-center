"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal } from "lucide-react";
import { TaskCard, type TaskData } from "./task-card";

export interface ColumnData {
  id: string;
  title: string;
  order: number;
  boardId: string;
  tasks: TaskData[];
}

interface ColumnProps {
  column: ColumnData;
  onAddTask: (columnId: string, columnTitle: string) => void;
  onTaskClick: (task: TaskData) => void;
}

export function Column({ column, onAddTask, onTaskClick }: ColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/50">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200">{column.title}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1.5 text-[10px] font-medium text-slate-400">
            {column.tasks.length}
          </span>
        </div>
        <button className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Droppable task area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-[100px] flex-1 flex-col gap-2 px-2 pb-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-blue-500/5 rounded-lg" : ""
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add task button */}
      <div className="p-2 pt-0">
        <button
          onClick={() => onAddTask(column.id, column.title)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 py-2 text-xs text-slate-500 transition-colors hover:border-slate-600 hover:bg-slate-800/50 hover:text-slate-400"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </button>
      </div>
    </div>
  );
}
