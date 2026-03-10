"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  deadline: string;
  isConfirmed: boolean;
  confirmedDate: string | null;
  confirmedSlot: string | null;
}

interface UnavailableSlot {
  date: string;
  timeSlot: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function slotKey(date: string, hour: number) {
  return `${date}|${hour}`;
}

function toLocalDate(dateStr: string): Date {
  return new Date(dateStr.split("T")[0] + "T00:00:00");
}

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = toLocalDate(startDate);
  const end = toLocalDate(endDate);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateShort(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatDate(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatHour(h: number) {
  return `${h}:00`;
}


function HourlyDragGrid({
  dates,
  unavailableSlots,
  setUnavailableSlots,
}: {
  dates: string[];
  unavailableSlots: Set<string>;
  setUnavailableSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [activeDate, setActiveDate] = useState(dates[0] || "");
  const dragRef = useRef<{
    paintValue: boolean;
    startKey: string;
    startX: number;
    startY: number;
    pointerId: number;
    timer: ReturnType<typeof setTimeout> | null;
    dragging: boolean;
  } | null>(null);

  const isUnavailable = (date: string, hour: number) =>
    unavailableSlots.has(slotKey(date, hour));

  const applySlot = (key: string, value: boolean) => {
    setUnavailableSlots((prev) => {
      if (prev.has(key) === value) return prev;
      const next = new Set(prev);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest("[data-slot-key]") as HTMLElement | null;
    if (!cell) return;
    const key = cell.dataset.slotKey!;
    const paintValue = !unavailableSlots.has(key);

    // Mouse: activate drag immediately
    if (e.pointerType === "mouse") {
      dragRef.current = { paintValue, startKey: key, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId, timer: null, dragging: true };
      applySlot(key, paintValue);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    // Touch: wait for long-press before activating drag
    const container = e.currentTarget;
    const timer = setTimeout(() => {
      if (dragRef.current) {
        dragRef.current.dragging = true;
        container.setPointerCapture(dragRef.current.pointerId);
        applySlot(dragRef.current.startKey, dragRef.current.paintValue);
      }
    }, 150);

    dragRef.current = { paintValue, startKey: key, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId, timer, dragging: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { dragging, startY, timer } = dragRef.current;

    if (!dragging) {
      // Cancel long-press if user scrolls vertically
      if (Math.abs(e.clientY - startY) > 5) {
        if (timer) clearTimeout(timer);
        dragRef.current = null;
      }
      return;
    }

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const cell = el.closest("[data-slot-key]") as HTMLElement | null;
    if (!cell) return;
    applySlot(cell.dataset.slotKey!, dragRef.current.paintValue);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { dragging, timer, startKey, paintValue } = dragRef.current;

    if (timer) clearTimeout(timer);

    // Tap (no drag activated) → single cell toggle
    if (!dragging) {
      applySlot(startKey, paintValue);
    }

    dragRef.current = null;
  };

  const toggleAllDay = (date: string) => {
    const allSelected = HOURS.every((h) => isUnavailable(date, h));
    setUnavailableSlots((prev) => {
      const next = new Set(prev);
      HOURS.forEach((h) => {
        const key = slotKey(date, h);
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const countForDate = (date: string) => HOURS.filter((h) => isUnavailable(date, h)).length;
  const allDaySelected = HOURS.every((h) => isUnavailable(activeDate, h));

  return (
    <div>
      {/* Date tab track */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const count = countForDate(date);
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setActiveDate(date)}
              className={cn(
                "flex min-w-[52px] shrink-0 flex-col items-center rounded-lg px-3 py-2 transition-all duration-200",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xs font-medium">{WEEKDAY_NAMES[d.getDay()]}</span>
              <span className="tabular-nums text-sm font-bold">
                {d.getMonth() + 1}/{d.getDate()}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "font-display mt-0.5 text-xs font-semibold",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {countForDate(activeDate) === 0
            ? "탭하거나 드래그해서 불가 시간 선택"
            : `${countForDate(activeDate)}시간 불가로 표시됨`}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => toggleAllDay(activeDate)}
          className="h-8 px-3 text-xs"
        >
          {allDaySelected ? "전체 해제" : "하루 전체"}
        </Button>
      </div>

      {/* Hour grid */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "pan-y" }}
        className="grid grid-cols-2 gap-2"
      >
        {HOURS.map((hour) => {
          const unavail = isUnavailable(activeDate, hour);
          const key = slotKey(activeDate, hour);
          return (
            <div
              key={hour}
              data-slot-key={key}
              className={cn(
                "flex cursor-pointer select-none items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200",
                unavail ? "neu-slot-unavail" : "neu-slot-avail"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none tabular-nums text-sm font-semibold",
                  unavail ? "text-primary" : "text-foreground"
                )}
              >
                {hour}:00
              </span>
              <span
                className={cn(
                  "pointer-events-none text-xs font-semibold",
                  unavail ? "text-primary/70" : "text-muted-foreground"
                )}
              >
                {unavail ? "불가" : "가능"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [namePhoneError, setNamePhoneError] = useState("");

  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/invite/${token}`);
      const data = await res.json();
      if (res.ok) setMeeting(data);
      else setError(data.error || "약속을 찾을 수 없습니다.");
    } catch {
      setError("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  useEffect(() => {
    if (meeting && !isEditing) {
      const allSlots = new Set<string>();
      const d = getDateRange(meeting.startDate, meeting.endDate);
      for (const date of d) for (const h of HOURS) allSlots.add(slotKey(date, h));
      setUnavailableSlots(allSlots);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting]);

  useEffect(() => {
    if (!token) return;
    const storedEdit = localStorage.getItem(`editToken-${token}`);
    if (storedEdit) {
      setEditToken(storedEdit);
      setIsEditing(true);
      setStep(2);
      return;
    }
    const storedCreator = localStorage.getItem(`creator-${token}`);
    if (storedCreator) {
      try {
        const { name: cName, phone: cPhone } = JSON.parse(storedCreator);
        setName(cName || "");
        setPhone(cPhone || "");
      } catch {}
    }
  }, [token]);

  const handleNamePhoneNext = () => {
    setNamePhoneError("");
    if (!name.trim()) { setNamePhoneError("이름을 입력해주세요."); return; }
    const normalized = phone.replace(/[-\s]/g, "");
    if (!normalized) { setNamePhoneError("전화번호를 입력해주세요."); return; }
    if (!/^\d{10,11}$/.test(normalized)) {
      setNamePhoneError("전화번호는 10-11자리 숫자로 입력해주세요. (예: 01012345678)");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitLoading(true);
    try {
      const slotsArray: UnavailableSlot[] = Array.from(unavailableSlots).map((key) => {
        const [date, timeSlot] = key.split("|");
        return { date, timeSlot };
      });
      let res: Response;
      if (isEditing && editToken) {
        res = await fetch(`/api/invite/${token}/respond`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editToken, unavailableSlots: slotsArray }),
        });
      } else {
        res = await fetch(`/api/invite/${token}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.replace(/[-\s]/g, ""),
            unavailableSlots: slotsArray,
          }),
        });
      }
      const data = await res.json();
      if (res.status === 409) {
        setSubmitError("이미 응답하셨습니다.");
        if (data.editToken) {
          localStorage.setItem(`editToken-${token}`, data.editToken);
          setEditToken(data.editToken);
        }
        return;
      }
      if (!res.ok) { setSubmitError(data.error || "오류가 발생했습니다."); return; }
      if (data.editToken) {
        localStorage.setItem(`editToken-${token}`, data.editToken);
        setEditToken(data.editToken);
      }
      if (!isEditing) {
        try {
          const stored = JSON.parse(localStorage.getItem("my-responded-meetings") || "[]");
          if (!stored.some((m: { token: string }) => m.token === token) && meeting) {
            stored.unshift({
              token,
              meetingId: meeting.id,
              title: meeting.title,
              respondedAt: new Date().toISOString(),
            });
            localStorage.setItem("my-responded-meetings", JSON.stringify(stored.slice(0, 50)));
          }
        } catch {}
      }
      setSubmitted(true);
    } catch {
      setSubmitError("서버와 연결할 수 없습니다.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditResponse = () => {
    setIsEditing(true);
    setSubmitted(false);
    setStep(2);
    setUnavailableSlots(new Set());
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ border: "1px solid rgba(68,220,234,0.2)", background: "rgba(68,220,234,0.06)" }}
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm p-8 text-center">
          <CardContent className="p-0">
            <p className="mb-6 text-foreground">{error || "약속을 찾을 수 없습니다."}</p>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-6")}>
              홈으로 돌아가기
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dates = getDateRange(meeting.startDate, meeting.endDate);

  /* ── Submitted ── */
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8 text-center sm:p-12">
          <CardContent className="p-0">
            <div className="mb-6 flex justify-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full neu-glow-pulse"
                style={{
                  background: "radial-gradient(circle at 40% 40%, rgba(52,211,153,0.25), rgba(52,211,153,0.06))",
                  border: "1px solid rgba(52,211,153,0.4)",
                }}
              >
                <CheckCircle size={32} strokeWidth={1.5} style={{ color: "#34D399" }} />
              </div>
            </div>

            <h1 className="font-display mb-2 text-xl font-bold text-foreground sm:text-2xl">
              {isEditing ? "응답이 수정되었습니다!" : "응답이 제출되었습니다!"}
            </h1>
            <p className="mb-8 text-muted-foreground">
              <strong className="text-foreground">{meeting.title}</strong> 약속에 응답해
              주셨습니다.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href={`/meetings/${meeting.id}/manage`}
                className={cn(buttonVariants(), "h-11 text-sm font-semibold")}
              >
                응답 현황 보기
              </Link>
              {editToken && (
                <Button variant="outline" onClick={handleEditResponse} className="h-11 text-sm">
                  응답 수정하기
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-background">
      <Header maxWidth="lg">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4 text-sm")}>
          ← 홈
        </Link>
      </Header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">

        {/* Meeting info */}
        <Card className="p-6">
          <CardContent className="p-0">
            <h1 className="font-display mb-1 text-xl font-bold tracking-tight text-foreground">
              {meeting.title}
            </h1>
            {meeting.description && (
              <p className="mb-4 text-sm text-muted-foreground">{meeting.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  기간
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateShort(meeting.startDate)} — {formatDateShort(meeting.endDate)}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  마감
                </p>
                <p className="text-sm font-medium text-foreground">{formatDate(meeting.deadline)}</p>
              </div>
            </div>

            {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
              <div
                className="mt-4 flex items-center gap-3 rounded-xl p-4"
                style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(52,211,153,0.15)" }}
                >
                  <CheckCircle size={16} style={{ color: "#34D399" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#34D399" }}>약속 확정</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateShort(meeting.confirmedDate)} ·{" "}
                    {formatHour(parseInt(meeting.confirmedSlot))}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {meeting.isConfirmed ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <p className="text-muted-foreground">약속 일정이 확정되어 응답을 받지 않습니다.</p>
            </CardContent>
          </Card>
        ) : isEditing ? (
          <Card className="p-6">
            <CardHeader className="mb-4 p-0">
              <CardTitle className="font-display font-bold text-foreground">응답 수정</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                불가능한 시간을 탭하거나 드래그하여 선택하세요.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <HourlyDragGrid
                dates={dates}
                unavailableSlots={unavailableSlots}
                setUnavailableSlots={setUnavailableSlots}
              />
              {submitError && (
                <div
                  className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{submitError}</p>
                </div>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="mt-5 w-full h-11 text-sm font-semibold"
              >
                {submitLoading ? "저장 중..." : "응답 수정 완료 →"}
              </Button>
            </CardContent>
          </Card>
        ) : step === 1 ? (
          <Card className="p-6">
            <CardHeader className="mb-5 p-0">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary"
                  style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}
                >
                  01
                </span>
                <CardTitle className="text-sm font-bold text-foreground">참가자 정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {namePhoneError && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{namePhoneError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    이름 <span className="text-primary">*</span>
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                    placeholder="이름을 입력하세요"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    전화번호 <span className="text-primary">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                    placeholder="01012345678"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    하이픈(-) 없이 숫자만 입력해주세요
                  </p>
                </div>
              </div>

              <Button
                onClick={handleNamePhoneNext}
                className="mt-6 w-full h-11 text-sm font-semibold"
              >
                다음 →
              </Button>
              {editToken && !isEditing && (
                <Button
                  variant="outline"
                  onClick={handleEditResponse}
                  className="mt-3 w-full h-11 text-sm"
                >
                  이전 응답 수정하기
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6">
            <CardHeader className="mb-2 p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary"
                    style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}
                  >
                    02
                  </span>
                  <CardTitle className="text-sm font-bold text-foreground">
                    불가능한 시간 선택
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-8 px-3 text-xs"
                >
                  ← 정보 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <p className="mb-5 text-sm text-muted-foreground">
                <strong className="text-foreground">{name}</strong>님, 불가능한 시간을 탭하거나
                드래그하여 선택하세요.
              </p>

              <HourlyDragGrid
                dates={dates}
                unavailableSlots={unavailableSlots}
                setUnavailableSlots={setUnavailableSlots}
              />

              {submitError && (
                <div
                  className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{submitError}</p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="mt-5 w-full h-11 text-sm font-semibold"
              >
                {submitLoading ? "제출 중..." : "응답 제출 →"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
