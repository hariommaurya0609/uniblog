"use client";

import { useState, useRef } from "react";
import {
  Lock,
  Terminal,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

interface LogEntry {
  type: "info" | "success" | "error" | "warn" | "complete";
  message: string;
  timestamp: Date;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeComplete, setScrapeComplete] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Login Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setLoginError("");
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- Scrape Handler with SSE ---
  const handleScrape = async () => {
    setLogs([]);
    setIsScraping(true);
    setScrapeComplete(false);

    try {
      const res = await fetch("/api/admin/scrape", {
        credentials: "include", // send cookies
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setIsScraping(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setIsScraping(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const entry: LogEntry = {
                type: data.type,
                message: data.message,
                timestamp: new Date(),
              };
              setLogs((prev) => [...prev, entry]);
              setTimeout(scrollToBottom, 50);
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      setScrapeComplete(true);
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          message: `Connection error: ${String(err)}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsScraping(false);
    }
  };

  // --- Icon for log type ---
  const LogIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />;
      case "complete":
        return <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-gray-400 shrink-0" />;
    }
  };

  // ========= LOGIN SCREEN =========
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="mt-1 text-sm text-gray-400">
              UniBlog Scraper Control
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                <XCircle className="h-4 w-4 shrink-0" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========= SCRAPE DASHBOARD =========
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Scraper Console</h1>
              <p className="text-xs text-gray-400">UniBlog Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Blog
            </a>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Scrape Control */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Run Scraper</h2>
            <p className="mt-1 text-sm text-gray-400">
              Fetch the latest articles from all configured company blogs
            </p>
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Scrape
              </>
            )}
          </button>
        </div>

        {/* Log Terminal */}
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900/80 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <span className="ml-2 text-xs text-gray-500 font-mono">
              scraper-console
            </span>
            {isScraping && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Running
              </span>
            )}
            {scrapeComplete && !isScraping && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-400">
                <CheckCircle className="h-3 w-3" />
                Complete
              </span>
            )}
          </div>

          {/* Log Content */}
          <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm">
            {logs.length === 0 && !isScraping ? (
              <div className="flex h-full items-center justify-center text-gray-600">
                <div className="text-center">
                  <Terminal className="mx-auto mb-3 h-10 w-10" />
                  <p>Click &quot;Start Scrape&quot; to begin</p>
                  <p className="mt-1 text-xs">
                    Logs will appear here in real-time
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 ${
                      log.type === "complete"
                        ? "mt-3 pt-3 border-t border-gray-800"
                        : ""
                    }`}
                  >
                    <LogIcon type={log.type} />
                    <span className="text-xs text-gray-600 shrink-0 mt-0.5">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span
                      className={`whitespace-pre-wrap ${
                        log.type === "error"
                          ? "text-red-400"
                          : log.type === "success"
                            ? "text-green-400"
                            : log.type === "warn"
                              ? "text-yellow-400"
                              : log.type === "complete"
                                ? "text-blue-400 font-bold"
                                : "text-gray-300"
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Stats summary after completion */}
        {scrapeComplete &&
          logs.length > 0 &&
          (() => {
            const completeLog = logs.find((l) => l.type === "complete");
            const successCount =
              logs.filter((l) => l.type === "success").length - 1; // minus the sync log
            const errorCount = logs.filter((l) => l.type === "error").length;
            return (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {Math.max(0, successCount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Feeds Scraped</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {errorCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Errors</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {completeLog?.message.match(/(\d+) saved/)?.[1] || "0"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Articles Saved</p>
                </div>
              </div>
            );
          })()}
      </main>
    </div>
  );
}
