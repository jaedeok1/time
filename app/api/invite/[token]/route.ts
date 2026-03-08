import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { token },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        deadline: true,
        isConfirmed: true,
        confirmedDate: true,
        confirmedSlot: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting by token:", error);
    return NextResponse.json(
      { error: "모임 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
