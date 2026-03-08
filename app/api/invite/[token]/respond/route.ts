import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, phone, unavailableSlots } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "이름과 전화번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // Normalize phone number - remove hyphens and spaces
    const normalizedPhone = phone.replace(/[-\s]/g, "");

    // Validate phone number format (10-11 digits)
    if (!/^\d{10,11}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "전화번호 형식이 올바르지 않습니다. (10-11자리 숫자)" },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { token },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check for duplicate phone number
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        meetingId: meeting.id,
        phone: normalizedPhone,
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: "이미 응답하셨습니다. 수정하려면 수정 링크를 사용해주세요.", editToken: existingParticipant.editToken },
        { status: 409 }
      );
    }

    // Create participant with unavailable slots
    const participant = await prisma.participant.create({
      data: {
        meetingId: meeting.id,
        name,
        phone: normalizedPhone,
        unavailableSlots: {
          create: (unavailableSlots || []).map((slot: { date: string; timeSlot: string }) => ({
            date: slot.date,
            timeSlot: slot.timeSlot,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, editToken: participant.editToken });
  } catch (error) {
    console.error("Error creating participant response:", error);
    return NextResponse.json(
      { error: "응답을 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { editToken, unavailableSlots } = body;

    if (!editToken) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { token },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const participant = await prisma.participant.findFirst({
      where: {
        editToken,
        meetingId: meeting.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // Delete existing slots and recreate
    await prisma.unavailableSlot.deleteMany({
      where: { participantId: participant.id },
    });

    if (unavailableSlots && unavailableSlots.length > 0) {
      await prisma.unavailableSlot.createMany({
        data: unavailableSlots.map((slot: { date: string; timeSlot: string }) => ({
          participantId: participant.id,
          date: slot.date,
          timeSlot: slot.timeSlot,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating participant response:", error);
    return NextResponse.json(
      { error: "응답을 수정하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
