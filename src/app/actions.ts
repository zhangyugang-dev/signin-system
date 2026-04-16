"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateEvent({ name, eventTime }: { name: string; eventTime: string }) {
  const event = await prisma.event.findFirst();
  if (event) {
    await prisma.event.update({
      where: { id: event.id },
      data: { name, eventTime: new Date(eventTime) },
    });
  } else {
    await prisma.event.create({
      data: { name, eventTime: new Date(eventTime) },
    });
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function getEvent() {
  return await prisma.event.findFirst();
}

export async function uploadAttendees(records: { name: string; phone: string }[]) {
  const attendees = records.map((r) => ({
    name: r.name.trim(),
    phone: r.phone.trim(),
    phoneLast4: r.phone.trim().slice(-4),
    source: "import",
  }));

  for (const a of attendees) {
    await prisma.attendee.create({ data: a });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, count: attendees.length };
}

export async function checkIn(name: string, phoneLast4: string) {
  const trimmedName = name.trim();

  // 1. 查找是否已有该 name+phoneLast4 的已签到记录
  const existingCheckedIn = await prisma.attendee.findFirst({
    where: { name: trimmedName, phoneLast4, checkedIn: true },
  });

  if (existingCheckedIn) {
    return { ok: false, error: "已签到，不可重复签到" };
  }

  // 2. 查找是否有预导入的未签到记录匹配
  const importedAttendee = await prisma.attendee.findFirst({
    where: { name: trimmedName, phoneLast4, checkedIn: false, source: "import" },
  });

  if (importedAttendee) {
    await prisma.attendee.update({
      where: { id: importedAttendee.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  }

  // 3. 公开签到：创建新的 walkin 记录，直接标记已签到
  await prisma.attendee.create({
    data: {
      name: trimmedName,
      phone: null,
      phoneLast4,
      checkedIn: true,
      checkedInAt: new Date(),
      source: "walkin",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function getStats() {
  const total = await prisma.attendee.count();
  const checkedIn = await prisma.attendee.count({ where: { checkedIn: true } });
  const walkinCount = await prisma.attendee.count({ where: { source: "walkin" } });
  return { total, checkedIn, unchecked: total - checkedIn, walkin: walkinCount };
}

export async function getAttendees() {
  return await prisma.attendee.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteAttendee(id: string) {
  await prisma.attendee.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function clearAttendees() {
  await prisma.attendee.deleteMany();
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}
