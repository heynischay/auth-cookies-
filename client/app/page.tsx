"use client";
import { useEffect, useState, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/";

type User = {
  id: string;
  name?: string;
  email: string;
};

type Note = {
  id: string;
  text: string;
  userId: string;
  createdAt?: string;
};

type Mode = "signin" | "signup";

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);

  // On first load, ask the backend "who am I?" using whatever cookie the
  // browser already has. This is how a refresh keeps you logged in.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? data);
        }
      } catch {
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadNotes() {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const res = await fetch(`${API_URL}/notes`, {
        credentials: "include",
      });
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok) throw new Error("Could not load notes");
      const data = await res.json();
      setNotes(data.notes ?? data);
    } catch (err: any) {
      setNotesError(err.message ?? "Something went wrong loading notes");
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const endpoint = mode === "signin" ? "/signin" : "/signup";
    const body = { email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Request failed");
      }

      setUser(data.user ?? null);

      setPassword("");
    } catch (err: any) {
      setFormError(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setNotes([]);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNotesError(null);
    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText }),
      });
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok) throw new Error("Could not save note");
      const data = await res.json();
      setNotes((prev) => [data.note ?? data, ...prev]);
      setNoteText("");
    } catch (err: any) {
      setNotesError(err.message ?? "Something went wrong saving that note");
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Checking session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Auth playground</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user
              ? "You're signed in — this is the protected area."
              : "Sign in or create an account to reach the protected notes."}
          </p>
        </header>

        {!user ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex mb-6 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setFormError(null);
                }}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-black"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setFormError(null);
                }}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-black"
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border text-black border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border text-black border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{user.email}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Log out
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Notes (protected route)</h2>

              <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write a note…"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white text-sm font-medium rounded-lg px-4 hover:bg-slate-800 transition-colors"
                >
                  Add
                </button>
              </form>

              {notesError && <p className="text-sm text-red-600 mb-3">{notesError}</p>}

              {notesLoading ? (
                <p className="text-sm text-slate-400">Loading notes…</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No notes yet — add one above to confirm the cookie is being sent with your requests.
                </p>
              ) : (
                <ul className="space-y-2">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-black"
                    >
                      <span className="text-xl text-black">{note.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
