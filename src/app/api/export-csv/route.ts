import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const attendees = await prisma.attendee.findMany({
    orderBy: { createdAt: "asc" },
  });

  const header = "姓名,手机号,手机号后四位,签到状态,签到时间\n";
  const rows = attendees
    .map((a) => {
      const status = a.checkedIn ? "已签到" : "未签到";
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
      return `${a.name},${a.phone},${a.phoneLast4},${status},${time}`;
    })
    .join("\n");

  const csv = header + rows;
  // Add BOM for Excel compatibility with Chinese characters
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendees.csv"',
    },
  });
}
