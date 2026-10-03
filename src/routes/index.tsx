import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

type Todo = { id: string; title: string; done: boolean };
type Filter = "all" | "active" | "done";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "done", label: "Done" },
];

// Chip colors cycle through the palette, matching the direction's colored ticks.
const CHIP_COLORS = ["bg-mint", "bg-butter", "bg-lilac"] as const;

const STORAGE_KEY = "playful-todo.v1";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t): t is Todo =>
          typeof t === "object" &&
          t !== null &&
          typeof (t as Todo).id === "string" &&
          typeof (t as Todo).title === "string" &&
          typeof (t as Todo).done === "boolean"
      )
      .slice(0, 500);
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Todo. — playful oversized task list" },
      {
        name: "description",
        content:
          "A playful, oversized to-do app: add, edit, complete and clear tasks, all saved locally.",
      },
      { property: "og:title", content: "Todo. — playful oversized task list" },
      {
        property: "og:description",
        content: "Add, edit, complete and clear your tasks in a warm, chunky to-do app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Restore saved tasks after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    setTodos(loadTodos());
    setHydrated(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // storage full or unavailable — the app keeps working in-session
    }
  }, [todos, hydrated]);

  const activeCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - activeCount;

  const visible =
    filter === "all"
      ? todos
      : todos.filter((t) => (filter === "done" ? t.done : !t.done));

  function addTodo() {
    const title = draft.trim();
    if (!title) return;
    if (title.length > 200) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), title, done: false },
      ...prev,
    ]);
    setDraft("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.done));
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditDraft(todo.title);
    requestAnimationFrame(() => {
      const input = editInputRef.current;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  function saveEdit() {
    const title = editDraft.trim();
    if (editingId && title && title.length <= 200) {
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, title } : t))
      );
    }
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-[60ch] px-5 py-10 sm:py-16">
        <header className="rise mb-8 flex items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2.6rem,9vw,4.6rem)] font-black leading-[0.86] tracking-tight text-balance">
            To<span className="text-coral">do</span>
            <span className="text-mint">.</span>
          </h1>
          <span className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-paper">
            {activeCount} left
          </span>
        </header>

        <form
          className="rise flex gap-2 rounded-3xl border-2 border-ink bg-cream p-2 shadow-[6px_6px_0_var(--color-ink)]"
          style={{ animationDelay: "80ms" }}
          onSubmit={(e) => {
            e.preventDefault();
            addTodo();
          }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-lg outline-none placeholder:text-ink/40"
            placeholder="Add a task…"
            aria-label="New task"
            maxLength={200}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-coral px-5 py-2 text-lg font-bold text-paper ring-1 ring-black/5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--color-ink)] active:translate-y-0 active:shadow-none"
          >
            Add
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-black/5 transition-colors " +
                (filter === f.id
                  ? "bg-mint text-ink"
                  : "bg-cream text-ink/60 hover:text-ink")
              }
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="pop mt-6 rounded-2xl border-2 border-dashed border-ink/25 bg-cream/50 p-10 text-center">
            <p className="text-lg font-bold text-ink/50">
              {filter === "done"
                ? "Nothing done yet — go do something."
                : filter === "active"
                  ? "All clear. Nothing left to do."
                  : "No tasks yet — add your first one above."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((todo, i) => {
              const chipColor = CHIP_COLORS[i % CHIP_COLORS.length];
              const isEditing = editingId === todo.id;
              return (
                <li
                  key={todo.id}
                  className="slide-in flex items-center gap-3 rounded-2xl bg-cream p-3 ring-1 ring-black/5"
                  style={{ animationDelay: `${140 + i * 50}ms` }}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={todo.done ? "Mark as not done" : "Mark as done"}
                    aria-pressed={todo.done}
                    className={
                      "grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink text-lg font-black transition-colors " +
                      (todo.done
                        ? chipColor + " text-ink"
                        : "bg-paper text-ink/15 hover:text-ink/40")
                    }
                  >
                    ✓
                  </button>

                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      className="min-w-0 flex-1 rounded-lg border-2 border-ink bg-paper px-2 py-1 text-lg font-medium outline-none"
                      value={editDraft}
                      maxLength={200}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={saveEdit}
                      aria-label="Edit task"
                    />
                  ) : (
                    <span
                      className={
                        "flex-1 text-lg font-medium " +
                        (todo.done
                          ? "text-ink/45 line-through decoration-2 decoration-mint"
                          : "")
                      }
                    >
                      {todo.title}
                    </span>
                  )}

                  {isEditing ? (
                    <>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={saveEdit}
                        className="text-sm font-bold text-mint"
                      >
                        Save
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setEditingId(null)}
                        className="text-sm font-bold text-ink/40"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(todo)}
                        className="text-sm font-bold text-ink/40 hover:text-ink"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-sm font-bold text-coral hover:opacity-80"
                      >
                        Del
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <footer className="rise mt-8 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-ink/55">
            {doneCount} of {todos.length} done
          </span>
          <button
            onClick={clearCompleted}
            disabled={doneCount === 0}
            className="rounded-full bg-butter px-4 py-1.5 text-sm font-bold text-ink ring-1 ring-black/5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_0_var(--color-ink)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Clear completed
          </button>
        </footer>
      </div>
    </div>
  );
}
