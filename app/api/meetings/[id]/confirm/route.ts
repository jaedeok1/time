import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, timeSlot } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: "날짜와 시간대를 선택해주세요." },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        isConfirmed: true,
        confirmedDate: date,
        confirmedSlot: timeSlot,
      },
    });

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("Error confirming meeting:", error);
    return NextResponse.json(
      { error: "모임 확정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
