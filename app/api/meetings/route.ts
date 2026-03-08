import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, startDate, endDate, deadline, name, phone } = body;

    if (!title || !startDate || !endDate || !deadline) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!name || !phone) {
      return NextResponse.json(
        { error: "이름과 전화번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[-\s]/g, "");
    if (!/^\d{10,11}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "전화번호 형식이 올바르지 않습니다. (10-11자리 숫자)" },
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
        participants: {
          create: {
            name,
            phone: normalizedPhone,
          },
        },
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
