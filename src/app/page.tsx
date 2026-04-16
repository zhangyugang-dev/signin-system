"use client";

import { useState, useTransition, useEffect } from "react";
import { checkIn, getEvent, getStats } from "@/app/actions";

interface EventData {
  id: string;
  name: string;
  eventTime: Date;
}

export default function CheckInPage() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, unchecked: 0 });
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const [e, s] = await Promise.all([getEvent(), getStats()]);
      if (e) setEvent(e as unknown as EventData);
      setStats(s);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!name.trim() || phoneLast4.length !== 4) {
      setResult({ type: "error", message: "请填写完整的姓名和手机号后四位" });
      return;
    }

    startTransition(async () => {
      const res = await checkIn(name, phoneLast4);
      if (res.ok) {
        setResult({ type: "success", message: `${name}，签到成功！` });
        setName("");
        setPhoneLast4("");
        // Refresh stats
        const s = await getStats();
        setStats(s);
      } else {
        setResult({ type: "error", message: res.error || "签到失败" });
      }
    });
  }

  const formattedTime = event
    ? new Date(event.eventTime).toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-3 flex justify-end">
        <a
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          管理后台
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Event Info */}
          <div className="text-center mb-8">
            {event ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <p className="mt-2 text-gray-500">{formattedTime}</p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">会议签到</h1>
            )}
          </div>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{stats.checkedIn}</p>
                <p className="text-xs text-gray-500">已签到</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{stats.unchecked}</p>
                <p className="text-xs text-gray-500">未签到</p>
              </div>
            </div>
          )}

          {/* Check-in Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">参会签到</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isPending}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  手机号后四位
                </label>
                <input
                  id="phone"
                  type="text"
                  value={phoneLast4}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPhoneLast4(v);
                  }}
                  placeholder="请输入手机号后四位"
                  maxLength={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isPending}
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !name || phoneLast4.length !== 4}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "签到中..." : "签到"}
              </button>
            </form>

            {result && (
              <div
                className={`mt-4 p-3 rounded-md border text-sm ${
                  result.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {result.message}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-400">
        会务签到系统
      </footer>
    </div>
  );
}
