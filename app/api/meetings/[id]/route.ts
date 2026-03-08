import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i)); // ["0".."23"]

function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        participants: {
          include: { unavailableSlots: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "모임을 찾을 수 없습니다." }, { status: 404 });
    }

    // Calculate optimal time slots (per hour)
    const dates = getDateRange(meeting.startDate, meeting.endDate);
    const totalParticipants = meeting.participants.length;

    const timeOptions: {
      date: string;
      timeSlot: string;
      availableCount: number;
      unavailableCount: number;
    }[] = [];

    for (const date of dates) {
      for (const hour of HOURS) {
        const unavailableCount = meeting.participants.filter(
          (p: typeof meeting.participants[number]) =>
            p.unavailableSlots.some(
              (s: { date: string; timeSlot: string }) =>
                s.date === date && s.timeSlot === hour
            )
        ).length;

        const availableCount = totalParticipants - unavailableCount;
        timeOptions.push({ date, timeSlot: hour, availableCount, unavailableCount });
      }
    }

    timeOptions.sort((a, b) => b.availableCount - a.availableCount);
    const top5 = timeOptions.slice(0, 5);

    const participantsWithMaskedPhone = meeting.participants.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
      createdAt: p.createdAt,
      unavailableSlotsCount: p.unavailableSlots.length,
    }));

    return NextResponse.json({
      ...meeting,
      participants: participantsWithMaskedPhone,
      totalParticipants,
      optimalSlots: top5,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "모임 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
