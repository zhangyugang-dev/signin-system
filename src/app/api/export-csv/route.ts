import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ExportAttendee = {
  name: string;
  phone: string | null;
  phoneLast4: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  source: string;
};

export async function GET() {
  const attendees = await prisma.attendee.findMany({
    orderBy: { createdAt: "asc" },
  });

  const header = "姓名,手机号,手机号后四位,来源,签到状态,签到时间\n";
  const rows = (attendees as ExportAttendee[])
    .map((a) => {
      const status = a.checkedIn ? "已签到" : "未签到";
      const source = a.source === "walkin" ? "现场" : "导入";
      const phone = a.phone || "";
      const time = a.checkedInAt
        ? new Date(a.checkedInAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "";
      return `${a.name},${phone},${a.phoneLast4},${source},${status},${time}`;
    })
    .join("\n");

  const csv = header + rows;
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendees.csv"',
    },
  });
}
