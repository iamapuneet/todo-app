/**
 * Todo Application — Alpine.js Reactive UI Controller
 * Featuring Client-Side UI Caching (Instant Render + Draft Persistence + Filter Memory)
 * API requests always query database directly without server-side API cache.
 */

document.addEventListener("alpine:init", () => {
  Alpine.data("todoApp", () => ({
    // UI State
    todos: [],
    loading: false,
    initialLoaded: false,
    cacheHitOnLoad: false,
    searchQuery: "",
    activeFilter: Alpine.$persist("all").as("todo_ui_filter"),
    sortOrder: Alpine.$persist("newest").as("todo_ui_sort"),

    // Quick add input state
    quickTitle: "",

    // Draft persistence in UI Cache (User typing is never lost)
    newTodo: {
      title: Alpine.$persist("").as("todo_ui_draft_title"),
      description: Alpine.$persist("").as("todo_ui_draft_desc"),
      status: "pending",
    },

    // Edit Modal State
    editingTodo: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,

    // Toast Notification System
    toasts: [],

    // Initialize Component
    init() {
      // 1. Instant UI Cache Hydration: Render cached todos immediately from localStorage
      const cached = localStorage.getItem("todo_ui_cached_items");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.todos = parsed;
            this.cacheHitOnLoad = true;
          }
        } catch (e) {
          console.warn("Failed to parse cached UI todos", e);
        }
      }

      // 2. Fetch fresh live data from database immediately
      this.fetchTodos();

      // 3. Initialize Lucide Icons
      this.$nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
      });

      // 4. Watch for changes to re-render icons
      this.$watch("todos", () => {
        this.$nextTick(() => {
          if (window.lucide) window.lucide.createIcons();
        });
      });
    },

    // Fetch todos directly from backend API
    async fetchTodos() {
      this.loading = true;
      try {
        const res = await fetch("/api/todos");
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          this.todos = json.data;
          this.initialLoaded = true;

          // Update UI Cache for instant rendering on next page visit
          localStorage.setItem(
            "todo_ui_cached_items",
            JSON.stringify(json.data)
          );
        } else {
          this.showToast(json.message || "Failed to fetch todos.", "error");
        }
      } catch (err) {
        this.showToast("Network error. Please check your connection.", "error");
      } finally {
        this.loading = false;
      }
    },

    // Quick Add directly from top input bar
    async handleQuickAdd() {
      const title = this.quickTitle.trim();
      if (!title) return;

      this.loading = true;
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            status: "pending",
          }),
        });

        const json = await res.json();

        if (json.success) {
          this.quickTitle = "";
          this.showToast("Task added!", "success");
          await this.fetchTodos();
        } else {
          this.showToast(json.message || "Failed to add task.", "error");
        }
      } catch (err) {
        this.showToast("Network error while adding task.", "error");
      } finally {
        this.loading = false;
      }
    },

    // Create a new task with full modal dialog
    async handleCreateTodo() {
      const title = this.newTodo.title.trim();
      if (!title) {
        this.showToast("Title is required.", "error");
        return;
      }

      this.loading = true;
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: this.newTodo.description.trim() || null,
            status: this.newTodo.status,
          }),
        });

        const json = await res.json();

        if (json.success) {
          // Clear draft from UI cache
          this.newTodo.title = "";
          this.newTodo.description = "";
          this.newTodo.status = "pending";
          this.isCreateModalOpen = false;

          this.showToast("Task created successfully!", "success");
          await this.fetchTodos();
        } else {
          this.showToast(json.message || "Could not create task.", "error");
        }
      } catch (err) {
        this.showToast("Network error while creating task.", "error");
      } finally {
        this.loading = false;
      }
    },

    // Open Edit Modal
    openEditModal(todo) {
      this.editingTodo = {
        id: todo.id,
        title: todo.title,
        description: todo.description || "",
        status: todo.status,
      };
      this.isEditModalOpen = true;
    },

    // Update existing task
    async handleUpdateTodo() {
      if (!this.editingTodo) return;

      const title = this.editingTodo.title.trim();
      if (!title) {
        this.showToast("Title cannot be empty.", "error");
        return;
      }

      this.loading = true;
      try {
        const res = await fetch(`/api/todos/${this.editingTodo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: this.editingTodo.description.trim() || null,
            status: this.editingTodo.status,
          }),
        });

        const json = await res.json();

        if (json.success) {
          this.isEditModalOpen = false;
          this.editingTodo = null;
          this.showToast("Task updated successfully!", "success");
          await this.fetchTodos();
        } else {
          this.showToast(json.message || "Update failed.", "error");
        }
      } catch (err) {
        this.showToast("Network error while updating task.", "error");
      } finally {
        this.loading = false;
      }
    },

    // Quick toggle status (Pending -> In Progress -> Completed -> Pending)
    async toggleStatus(todo) {
      const nextStatusMap = {
        pending: "in_progress",
        in_progress: "completed",
        completed: "pending",
      };

      const nextStatus = nextStatusMap[todo.status] || "pending";

      try {
        const res = await fetch(`/api/todos/${todo.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });

        const json = await res.json();

        if (json.success) {
          // Optimistic local update for zero-latency feel
          todo.status = nextStatus;
          // Refresh from DB and update UI cache
          this.fetchTodos();
          this.showToast(`Status changed to ${this.formatStatus(nextStatus)}`, "info");
        } else {
          this.showToast(json.message || "Failed to update status.", "error");
        }
      } catch (err) {
        this.showToast("Network error updating status.", "error");
      }
    },

    // Delete task
    async handleDeleteTodo(id) {
      if (!confirm("Are you sure you want to delete this task?")) return;

      this.loading = true;
      try {
        const res = await fetch(`/api/todos/${id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (json.success) {
          this.showToast("Task deleted successfully.", "success");
          await this.fetchTodos();
        } else {
          this.showToast(json.message || "Delete failed.", "error");
        }
      } catch (err) {
        this.showToast("Network error while deleting task.", "error");
      } finally {
        this.loading = false;
      }
    },

    // Clear UI Cache manually
    clearUiCache() {
      localStorage.removeItem("todo_ui_cached_items");
      localStorage.removeItem("todo_ui_draft_title");
      localStorage.removeItem("todo_ui_draft_desc");
      this.cacheHitOnLoad = false;
      this.showToast("UI Cache cleared.", "info");
      this.fetchTodos();
    },

    // Computed: Filtered and Sorted Todos
    get filteredTodos() {
      let list = [...this.todos];

      // 1. Status Filter
      if (this.activeFilter !== "all") {
        list = list.filter((t) => t.status === this.activeFilter);
      }

      // 2. Search Query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
      }

      // 3. Sorting
      if (this.sortOrder === "newest") {
        list.sort((a, b) => b.id - a.id);
      } else if (this.sortOrder === "oldest") {
        list.sort((a, b) => a.id - b.id);
      } else if (this.sortOrder === "title") {
        list.sort((a, b) => a.title.localeCompare(b.title));
      }

      return list;
    },

    // Computed Stats
    get stats() {
      const total = this.todos.length;
      const completed = this.todos.filter((t) => t.status === "completed").length;
      const inProgress = this.todos.filter((t) => t.status === "in_progress").length;
      const pending = this.todos.filter((t) => t.status === "pending").length;
      const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

      return { total, completed, inProgress, pending, progressPercent };
    },

    // Helper: Format status label
    formatStatus(status) {
      if (status === "in_progress") return "In Progress";
      if (status === "completed") return "Completed";
      return "Pending";
    },

    // Helper: Format Date
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    // Show floating toast alert
    showToast(message, type = "info") {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type });

      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 3500);
    },
  }));
});
