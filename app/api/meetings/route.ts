import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, deadline } = body;

    if (!title || !startDate || !endDate || !deadline) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        deadline: new Date(deadline),
      },
    });

    return NextResponse.json({ id: meeting.id, token: meeting.token });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "모임을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
