"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import {
  updateEvent,
  uploadAttendees,
  getEvent,
  getStats,
  getAttendees,
  deleteAttendee,
  clearAttendees,
} from "@/app/actions";

interface Attendee {
  id: string;
  name: string;
  phone: string | null;
  phoneLast4: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  source: string;
  createdAt: Date;
}

interface EventData {
  id: string;
  name: string;
  eventTime: Date;
}

export default function AdminPage() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, unchecked: 0, walkin: 0 });
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [e, s, a] = await Promise.all([getEvent(), getStats(), getAttendees()]);
    setEvent(e);
    setStats(s);
    setAttendees(a as unknown as Attendee[]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (event) {
      setEventName(event.name);
      const d = new Date(event.eventTime);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      setEventTime(local.toISOString().slice(0, 16));
    }
  }, [event]);

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !eventTime) return;
    await updateEvent({ name: eventName, eventTime });
    await refresh();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .filter((l) => l.trim());

    if (lines.length < 2) {
      setUploadMsg("CSV 格式错误：至少需要表头和一行数据");
      return;
    }

    const records = lines.slice(1).map((line) => {
      const cols = line.split(",");
      return {
        name: cols[0]?.trim() || "",
        phone: cols[1]?.trim() || "",
      };
    });

    if (records.some((r) => !r.name || !r.phone)) {
      setUploadMsg("CSV 格式错误：每行需要 姓名,手机号");
      return;
    }

    startTransition(async () => {
      const result = await uploadAttendees(records);
      setUploadMsg(`成功导入 ${result.count} 位参会人`);
      await refresh();
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  async function handleDelete(id: string) {
    await deleteAttendee(id);
    await refresh();
  }

  async function handleClear() {
    if (confirm("确定要清空所有参会人数据吗？此操作不可撤销。")) {
      await clearAttendees();
      await refresh();
    }
  }

  const checkInUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">会务签到 · 管理后台</h1>
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            查看签到页面 →
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">签到统计</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="总人数" value={stats.total} color="blue" />
            <StatCard label="已签到" value={stats.checkedIn} color="green" />
            <StatCard label="未签到" value={stats.unchecked} color="gray" />
            <StatCard label="现场签到" value={stats.walkin} color="orange" />
          </div>
        </section>

        {/* Event Config */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">活动配置</h2>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动名称
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="请输入活动名称"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  活动时间
                </label>
                <input
                  type="datetime-local"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isPending || !eventName || !eventTime}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "保存中..." : "保存配置"}
            </button>
          </form>

          {event && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-medium">签到链接：</span>
                <code className="bg-blue-100 px-2 py-0.5 rounded text-xs">{checkInUrl}</code>
              </p>
            </div>
          )}
        </section>

        {/* CSV Upload */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">导入参会名单</h2>
          <p className="text-sm text-gray-500 mb-4">
            上传 CSV 文件，格式：姓名,手机号（第一行为表头）。未在名单中的参会人也可通过签到页面直接签到。
          </p>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="text-sm"
            />
          </div>
          {uploadMsg && (
            <p className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md border border-green-200">
              {uploadMsg}
            </p>
          )}
        </section>

        {/* Actions Bar */}
        <section className="flex items-center gap-3">
          <a
            href="/api/export-csv"
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            导出 CSV
          </a>
          {attendees.length > 0 && (
            <button
              onClick={handleClear}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              清空名单
            </button>
          )}
        </section>

        {/* Attendee List */}
        <section className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">参会人列表</h2>
          </div>
          {attendees.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              暂无参会人，可通过导入 CSV 名单或签到页面直接签到
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">姓名</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">手机号</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">来源</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">签到状态</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">签到时间</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-900">{a.name}</td>
                      <td className="px-6 py-3 text-gray-600">{a.phone || `****${a.phoneLast4}`}</td>
                      <td className="px-6 py-3">
                        {a.source === "walkin" ? (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                            现场
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            导入
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {a.checkedIn ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            已签到
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            未签到
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {a.checkedInAt
                          ? new Date(a.checkedInAt).toLocaleString("zh-CN")
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-red-600 hover:text-red-800 text-xs underline"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "gray" | "orange";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", value: "text-blue-900" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", value: "text-green-900" },
    gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", value: "text-gray-900" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", value: "text-orange-900" },
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <p className={`text-sm ${c.text}`}>{label}</p>
      <p className={`text-3xl font-semibold ${c.value}`}>{value}</p>
    </div>
  );
}
