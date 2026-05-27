import {
  Calendar,
  Check,
  ClipboardList,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Wifi,
  WifiOff,
  Trash2,
  X,
  Moon,
  Sun,
  Menu,
  User as UserIcon
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import { apiRequest } from "../lib/api";
import { createTaskSocket } from "../lib/socket";

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: ""
};

const statusOptions = [
  { label: "All Tasks", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" }
];

const priorityClasses = {
  low: "border-sky-200/50 bg-sky-50/70 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400",
  medium: "border-amber-200/50 bg-amber-50/70 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  high: "border-red-200/50 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
};

const Dashboard = () => {
  const { logout, token, user } = useAuth();
  const { toggleTheme, isDark } = useTheme();
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

  // Layout UI states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;

    return {
      total: tasks.length,
      completed,
      inProgress,
      pending: tasks.length - completed - inProgress
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
      setIsFormOpen(false);
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
    setIsFormOpen(true);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setIsFormOpen(true);
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

  const getStatusBorder = (taskStatus) => {
    if (taskStatus === "completed") return "border-l-[5px] border-l-emerald-500 dark:border-l-emerald-600";
    if (taskStatus === "in-progress") return "border-l-[5px] border-l-indigo-500 dark:border-l-indigo-600";
    return "border-l-[5px] border-l-amber-500 dark:border-l-amber-600";
  };

  // Reusable Sidebar content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-6">
      <div className="space-y-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <Check size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">AuraTasks</span>
            <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">Task Workspace</span>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserIcon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="space-y-1.5">
          <span className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Categories
          </span>
          {statusOptions.map((option) => (
            <button
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                status === option.value
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              key={option.value}
              onClick={() => {
                setStatus(option.value);
                setIsMobileSidebarOpen(false);
              }}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === "" && (
                <span className="rounded-md bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400 font-bold border border-slate-200/20">
                  {stats.total}
                </span>
              )}
              {option.value === "pending" && (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-bold border border-amber-500/10">
                  {stats.pending}
                </span>
              )}
              {option.value === "in-progress" && (
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/10">
                  {stats.inProgress}
                </span>
              )}
              {option.value === "completed" && (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/10">
                  {stats.completed}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global Stats Summary */}
        <div className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
            Task Progress
          </span>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                <span>Completed Tasks</span>
                <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center pt-1.5 border-t border-slate-200/30 dark:border-white/5">
              <div>
                <span className="block text-lg font-bold text-slate-800 dark:text-slate-200">{stats.inProgress}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-500">Active</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-slate-800 dark:text-slate-200">{stats.completed}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-500">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
        {/* Connection status */}
        <div
          className={`inline-flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold border ${
            isLiveConnected
              ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`relative flex h-2 w-2 rounded-full ${isLiveConnected ? "bg-emerald-500" : "bg-slate-400"}`}>
              {isLiveConnected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              )}
            </span>
            {isLiveConnected ? "Live Sync Active" : "Offline Sync"}
          </span>
          {isLiveConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold transition-colors"
            onClick={logout}
            type="button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="w-72 border-r border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hidden lg:block shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-out lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          aria-label="Close sidebar"
          className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <X size={20} />
        </button>
        {renderSidebarContent()}
      </aside>

      {/* Main Right Content Section */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              onClick={() => setIsMobileSidebarOpen(true)}
              type="button"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Welcome, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full max-w-lg justify-end">
            {/* Search tasks */}
            <div className="relative flex-1 max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") fetchTasks();
                }}
                placeholder="Search tasks..."
                type="search"
                value={search}
              />
            </div>

            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={fetchTasks}
              title="Refresh Tasks"
              type="button"
            >
              <RefreshCcw size={16} />
            </button>

            <button
              className="flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md active:scale-95 transition-all"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Quick Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Total tasks</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-500/80 block mb-1">Pending</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.pending}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-500/80 block mb-1">Active</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.inProgress}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-500/80 block mb-1">Completed</span>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.completed}</p>
              </div>
            </section>

            {/* Error state display */}
            {error ? (
              <div className="rounded-xl border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 px-4 py-3.5 text-sm text-red-700 dark:text-red-400" role="alert">
                {error}
              </div>
            ) : null}

            {/* Tasks Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
                  {status ? `${statusOptions.find((o) => o.value === status)?.label} List` : "All Task List"}
                </h2>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {tasks.length} item{tasks.length === 1 ? "" : "s"} shown
                </span>
              </div>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((item) => (
                    <div className="h-40 animate-pulse rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-slate-200/20 dark:bg-slate-900/30" key={item} />
                  ))}
                </div>
              ) : tasks.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <article
                      className={`relative rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group ${getStatusBorder(
                        task.status
                      )}`}
                      key={task._id}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className={`text-base font-bold tracking-tight leading-snug break-words ${
                            task.status === "completed"
                              ? "text-slate-400 dark:text-slate-500 line-through"
                              : "text-slate-800 dark:text-slate-100"
                          }`}>
                            {task.title}
                          </h3>
                          {/* Toggle status icon */}
                          <button
                            aria-label={task.status === "completed" ? "Mark task pending" : "Mark task completed"}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                              task.status === "completed"
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                : "border-slate-300 dark:border-slate-700 bg-transparent text-transparent hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500/30"
                            }`}
                            onClick={() => toggleComplete(task._id)}
                            type="button"
                          >
                            <Check size={13} strokeWidth={3} />
                          </button>
                        </div>

                        {task.description ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed break-words">
                            {task.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="flex flex-wrap gap-1.5">
                          {/* Status Badge */}
                          <span className="rounded-lg border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/40 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                            {task.status.replace("-", " ")}
                          </span>
                          {/* Priority Badge */}
                          <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${priorityClasses[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                          {/* Due Date */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                            <Calendar size={13} />
                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 opacity-80 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              aria-label="Edit task"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              onClick={() => startEditing(task)}
                              type="button"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              aria-label="Delete task"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 dark:border-red-950 bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              onClick={() => deleteTask(task._id)}
                              type="button"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-12 text-center">
                  <ClipboardList className="mx-auto text-slate-400 dark:text-slate-600" size={40} />
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No tasks found</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add a new task or change the current filter categories.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Floating Overlay Modal for Task Creation/Editing */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Modal Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={cancelEditing}
          />
          {/* Modal Content Card */}
          <div className="relative w-full max-w-lg rounded-2xl glass-panel p-6 shadow-xl border border-slate-200/50 dark:border-white/10 animate-slide-up z-10">
            <button
              aria-label="Close modal"
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              onClick={cancelEditing}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              {editingTask ? "Update this task's information." : "Add details to prioritize and track your task."}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="form-title">
                  Task Title
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3.5 text-base text-slate-950 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                  id="form-title"
                  name="title"
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Review pull request..."
                  type="text"
                  value={form.title}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="form-description">
                  Description
                </label>
                <textarea
                  className="min-h-24 w-full resize-y rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3.5 py-2.5 text-base text-slate-950 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                  id="form-description"
                  name="description"
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Task context, requirements, links..."
                  value={form.description}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="form-priority">
                    Priority
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-950 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                    id="form-priority"
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="form-dueDate">
                    Due Date
                  </label>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-950 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                    id="form-dueDate"
                    name="dueDate"
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    type="date"
                    value={form.dueDate}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                <button
                  className="h-11 flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 shadow-md active:scale-95 transition-all"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Saving..." : editingTask ? "Save changes" : "Add task"}
                </button>
                <button
                  className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={cancelEditing}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
