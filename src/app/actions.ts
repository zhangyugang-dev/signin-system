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
  }));

  for (const a of attendees) {
    await prisma.attendee.create({ data: a });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, count: attendees.length };
}

export async function checkIn(name: string, phoneLast4: string) {
  const attendee = await prisma.attendee.findFirst({
    where: { name: name.trim(), phoneLast4 },
  });

  if (!attendee) {
    return { ok: false, error: "不在参会名单中" };
  }

  if (attendee.checkedIn) {
    return { ok: false, error: "已签到，不可重复签到" };
  }

  await prisma.attendee.update({
    where: { id: attendee.id },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function getStats() {
  const total = await prisma.attendee.count();
  const checkedIn = await prisma.attendee.count({ where: { checkedIn: true } });
  return { total, checkedIn, unchecked: total - checkedIn };
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
