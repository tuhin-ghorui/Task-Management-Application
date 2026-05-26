import {
  Calendar,
  Check,
  Circle,
  ClipboardList,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Wifi,
  WifiOff,
  Trash2,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/useAuth";
import { apiRequest } from "../lib/api";
import { createTaskSocket } from "../lib/socket";

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: ""
};

const statusOptions = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In progress", value: "in-progress" },
  { label: "Completed", value: "completed" }
];

const priorityClasses = {
  low: "border-sky-200 bg-sky-50 text-sky-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700"
};

const Dashboard = () => {
  const { logout, token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveRefreshKey, setLiveRefreshKey] = useState(0);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;

    return {
      total: tasks.length,
      completed,
      inProgress
    };
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await apiRequest(`/tasks${query}`);
      setTasks(data.tasks || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, liveRefreshKey]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = createTaskSocket(token);
    const refreshTasks = () => setLiveRefreshKey((current) => current + 1);

    socket.on("connect", () => setIsLiveConnected(true));
    socket.on("disconnect", () => setIsLiveConnected(false));
    socket.on("connect_error", () => setIsLiveConnected(false));
    socket.on("task:created", refreshTasks);
    socket.on("task:updated", refreshTasks);
    socket.on("task:deleted", refreshTasks);

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate: form.dueDate || null
    };

    try {
      setIsSaving(true);

      if (editingTask) {
        await apiRequest(`/tasks/${editingTask._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      setForm(emptyForm);
      setEditingTask(null);
      await fetchTasks();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ""
    });
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setForm(emptyForm);
  };

  const toggleComplete = async (taskId) => {
    try {
      setError("");
      await apiRequest(`/tasks/${taskId}/toggle-complete`, { method: "PATCH" });
      await fetchTasks();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setError("");
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      await fetchTasks();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-medium text-emerald-700">Task workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Good to see you, {user?.name}
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium ${
                isLiveConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              {isLiveConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
              {isLiveConnected ? "Live sync on" : "Live sync off"}
            </div>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
              onClick={logout}
              type="button"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              {editingTask ? "Edit task" : "Create task"}
            </h2>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="title">
                  Title
                </label>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  id="title"
                  name="title"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  type="text"
                  value={form.title}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  id="description"
                  name="description"
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  value={form.description}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    id="priority"
                    name="priority"
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                    value={form.priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="dueDate">
                    Due date
                  </label>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    id="dueDate"
                    name="dueDate"
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    type="date"
                    value={form.dueDate}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {editingTask ? <Check size={18} /> : <Plus size={18} />}
                  {isSaving ? "Saving..." : editingTask ? "Save task" : "Add task"}
                </button>
                {editingTask ? (
                  <button
                    aria-label="Cancel edit"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
                    onClick={cancelEditing}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-2xl font-semibold text-slate-950">{stats.total}</p>
              <p className="mt-1 text-xs font-medium uppercase text-slate-500">Total</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-2xl font-semibold text-slate-950">{stats.inProgress}</p>
              <p className="mt-1 text-xs font-medium uppercase text-slate-500">Active</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-2xl font-semibold text-slate-950">{stats.completed}</p>
              <p className="mt-1 text-xs font-medium uppercase text-slate-500">Done</p>
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Tasks</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {tasks.length} task{tasks.length === 1 ? "" : "s"} shown
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block sm:w-72">
                  <span className="sr-only">Search tasks</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className="h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") fetchTasks();
                    }}
                    placeholder="Search tasks"
                    type="search"
                    value={search}
                  />
                </label>

                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  onClick={fetchTasks}
                  type="button"
                >
                  <RefreshCcw size={18} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {statusOptions.map((option) => (
                <button
                  className={`h-10 shrink-0 rounded-lg border px-4 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                    status === option.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {error ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map((item) => (
                    <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100" key={item} />
                  ))}
                </div>
              ) : tasks.length ? (
                tasks.map((task) => (
                  <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300" key={task._id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            aria-label={task.status === "completed" ? "Mark task pending" : "Mark task completed"}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
                            onClick={() => toggleComplete(task._id)}
                            type="button"
                          >
                            {task.status === "completed" ? <Check size={18} /> : <Circle size={18} />}
                          </button>
                          <h3 className={`text-base font-semibold ${task.status === "completed" ? "text-slate-500 line-through" : "text-slate-950"}`}>
                            {task.title}
                          </h3>
                        </div>
                        {task.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                            {task.status.replace("-", " ")}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${priorityClasses[task.priority]}`}>
                            {task.priority}
                          </span>
                          {task.dueDate ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                              <Calendar size={14} />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2 sm:shrink-0">
                        <button
                          aria-label="Edit task"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
                          onClick={() => startEditing(task)}
                          type="button"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          aria-label="Delete task"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                          onClick={() => deleteTask(task._id)}
                          type="button"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <ClipboardList className="mx-auto text-slate-400" size={36} />
                  <h3 className="mt-4 text-base font-semibold text-slate-950">No tasks found</h3>
                  <p className="mt-2 text-sm text-slate-600">Create a task or change the current filters.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
