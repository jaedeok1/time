"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

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
  const ymd = dateStr.split("T")[0];
  return new Date(ymd + "T00:00:00");
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

/* ─── HourlyDragGrid ────────────────────────────────────────────────── */

const TIME_GROUPS = [
  { label: "새벽", hours: [0, 1, 2, 3, 4, 5] },
  { label: "오전", hours: [6, 7, 8, 9, 10, 11] },
  { label: "오후", hours: [12, 13, 14, 15, 16, 17] },
  { label: "저녁", hours: [18, 19, 20, 21, 22, 23] },
];

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
  const dragRef = useRef<{ active: boolean; paintValue: boolean } | null>(null);

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
    dragRef.current = { active: true, paintValue };
    applySlot(key, paintValue);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current?.active) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const cell = el.closest("[data-slot-key]") as HTMLElement | null;
    if (!cell) return;
    applySlot(cell.dataset.slotKey!, dragRef.current.paintValue);
  };

  const handlePointerUp = () => { dragRef.current = null; };

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

  const countForDate = (date: string) =>
    HOURS.filter((h) => isUnavailable(date, h)).length;

  const allDaySelected = HOURS.every((h) => isUnavailable(activeDate, h));

  return (
    <div>
      {/* Date tabs */}
      <div className="flex gap-px overflow-x-auto pb-2 mb-6 border border-black">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const count = countForDate(date);
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setActiveDate(date)}
              className={`shrink-0 flex flex-col items-center px-4 py-3 transition-colors duration-100 min-w-[56px] relative ${
                isActive ? "bg-black text-white" : "bg-white text-black hover:bg-muted"
              }`}
            >
              <span className="font-mono text-xs">
                {WEEKDAY_NAMES[d.getDay()]}
              </span>
              <span className="font-mono text-sm font-bold">{d.getMonth() + 1}/{d.getDate()}</span>
              {count > 0 && (
                <span className={`font-mono text-xs mt-0.5 ${isActive ? "text-white/50" : "text-dim"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex justify-between items-center mb-4">
        <p className="font-mono text-xs text-dim tracking-wide">
          {countForDate(activeDate) === 0
            ? "탭하거나 드래그해서 선택"
            : `${countForDate(activeDate)}시간 불가로 표시`}
        </p>
        <button
          type="button"
          onClick={() => toggleAllDay(activeDate)}
          className="font-mono text-xs tracking-widest uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity duration-100"
        >
          {allDaySelected ? "전체 해제" : "하루 전체"}
        </button>
      </div>

      {/* Hour grid */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {TIME_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-2">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-px bg-black border border-black">
              {group.hours.map((hour) => {
                const unavail = isUnavailable(activeDate, hour);
                const key = slotKey(activeDate, hour);
                return (
                  <div
                    key={hour}
                    data-slot-key={key}
                    className={`flex items-center justify-between px-4 py-3 select-none cursor-pointer transition-colors duration-100 ${
                      unavail
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-muted"
                    }`}
                  >
                    <span className="font-mono text-sm pointer-events-none tabular-nums">
                      {hour}:00
                    </span>
                    <span className={`font-mono text-xs pointer-events-none tracking-widest uppercase ${
                      unavail ? "text-white/60" : "text-subtle"
                    }`}>
                      {unavail ? "불가" : "가능"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */

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
      if (res.ok) {
        setMeeting(data);
      } else {
        setError(data.error || "약속을 찾을 수 없습니다.");
      }
    } catch {
      setError("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMeeting(); }, [fetchMeeting]);

  // Default all slots to unavailable on load
  useEffect(() => {
    if (meeting && !isEditing) {
      const allSlots = new Set<string>();
      const d = getDateRange(meeting.startDate, meeting.endDate);
      for (const date of d) {
        for (const h of HOURS) {
          allSlots.add(slotKey(date, h));
        }
      }
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
        const normalizedPhone = phone.replace(/[-\s]/g, "");
        res = await fetch(`/api/invite/${token}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone: normalizedPhone, unavailableSlots: slotsArray }),
        });
      }

      const data = await res.json();

      if (res.status === 409) {
        setSubmitError("이미 응답하셨습니다.");
        if (data.editToken) { localStorage.setItem(`editToken-${token}`, data.editToken); setEditToken(data.editToken); }
        return;
      }
      if (!res.ok) { setSubmitError(data.error || "오류가 발생했습니다."); return; }
      if (data.editToken) { localStorage.setItem(`editToken-${token}`, data.editToken); setEditToken(data.editToken); }

      if (!isEditing) {
        try {
          const stored = JSON.parse(localStorage.getItem("my-responded-meetings") || "[]");
          const alreadyExists = stored.some((m: { token: string }) => m.token === token);
          if (!alreadyExists && meeting) {
            stored.unshift({ token, meetingId: meeting.id, title: meeting.title, respondedAt: new Date().toISOString() });
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

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="font-mono text-xs tracking-widest uppercase text-dim">불러오는 중...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <p className="font-mono text-sm mb-6">{error || "약속을 찾을 수 없습니다."}</p>
          <Link href="/" className="font-mono text-xs tracking-widest uppercase border-b border-black pb-0.5">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const dates = getDateRange(meeting.startDate, meeting.endDate);

  /* ── Submitted ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <span className="font-display text-lg font-bold tracking-widest uppercase">시간조율</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="border border-black p-12">
            <CheckCircle className="w-10 h-10 mx-auto mb-8" strokeWidth={1} />
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-4">
              {isEditing ? "응답 수정 완료" : "응답 제출 완료"}
            </p>
            <h1 className="font-serif text-3xl font-bold mb-3">감사합니다.</h1>
            <p className="text-dim mb-10">
              <strong className="text-black">{meeting.title}</strong> 약속에 응답해 주셨습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/meetings/${meeting.id}/manage`}
                className="bg-black text-white px-8 py-4 text-sm font-mono tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100"
              >
                응답 현황 보기
              </Link>
              {editToken && (
                <button
                  onClick={handleEditResponse}
                  className="border-2 border-black text-black px-8 py-4 text-sm font-mono tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-100"
                >
                  수정하기
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Main page ── */
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-widest uppercase hover:opacity-60 transition-opacity duration-100"
          >
            시간조율
          </Link>
          <Link
            href="/"
            className="font-mono text-xs tracking-widest uppercase border-b border-transparent hover:border-black transition-all duration-100 pb-0.5"
          >
            ← 홈
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-0">

        {/* Meeting info */}
        <div className="pb-8 border-b border-black">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {meeting.title}
          </h1>
          {meeting.description && (
            <p className="text-dim text-sm mb-4">{meeting.description}</p>
          )}
          <div className="flex gap-8 mt-4">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-dim mb-1">기간</p>
              <p className="text-sm font-medium">
                {formatDateShort(meeting.startDate)} — {formatDateShort(meeting.endDate)}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-dim mb-1">마감</p>
              <p className="text-sm font-medium">{formatDate(meeting.deadline)}</p>
            </div>
          </div>

          {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
            <div className="mt-6 bg-black text-white px-6 py-4 flex items-center gap-3">
              <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-0.5">확정됨</p>
                <p className="font-serif text-sm font-bold">
                  {formatDateShort(meeting.confirmedDate)} · {formatHour(parseInt(meeting.confirmedSlot))}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Confirmed — no more responses */}
        {meeting.isConfirmed ? (
          <div className="py-16 text-center">
            <p className="font-mono text-sm text-dim tracking-wide">
              약속 일정이 확정되어 응답을 받지 않습니다.
            </p>
          </div>

        /* Editing */
        ) : isEditing ? (
          <div className="pt-10">
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-8">
              응답 수정
            </p>
            <p className="text-sm text-dim mb-6">
              불가능한 시간을 탭하거나 드래그하여 선택하세요.<br />
              <span className="font-mono text-xs">■ = 불가 &nbsp; □ = 가능</span>
            </p>
            <HourlyDragGrid
              dates={dates}
              unavailableSlots={unavailableSlots}
              setUnavailableSlots={setUnavailableSlots}
            />
            {submitError && (
              <p className="font-mono text-xs mt-4">⚠ {submitError}</p>
            )}
            <div className="h-[3px] bg-black mt-8 mb-6" />
            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="w-full bg-black text-white py-4 text-sm font-mono tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              {submitLoading ? "저장 중..." : "응답 수정 완료 →"}
            </button>
          </div>

        /* Step 1: name / phone */
        ) : step === 1 ? (
          <div className="pt-10">
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-8">
              01 — 참가자 정보
            </p>

            {namePhoneError && (
              <div className="border-l-4 border-black bg-muted px-5 py-3 mb-8">
                <p className="font-mono text-xs">⚠ {namePhoneError}</p>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label className="block font-mono text-xs tracking-widest uppercase mb-3">
                  이름 <span className="text-dim">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                  placeholder="이름을 입력하세요"
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base placeholder:text-dim/50 focus:outline-none focus:border-b-4 transition-all duration-100"
                />
              </div>
              <div>
                <label className="block font-mono text-xs tracking-widest uppercase mb-3">
                  전화번호 <span className="text-dim">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                  placeholder="01012345678"
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base placeholder:text-dim/50 focus:outline-none focus:border-b-4 transition-all duration-100 font-mono"
                />
                <p className="font-mono text-xs text-dim mt-2">하이픈(-) 없이 숫자만 입력해주세요</p>
              </div>
            </div>

            <div className="h-[3px] bg-black mt-10 mb-6" />

            <button
              onClick={handleNamePhoneNext}
              className="w-full bg-black text-white py-4 text-sm font-mono tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              다음 →
            </button>

            {editToken && !isEditing && (
              <button
                onClick={handleEditResponse}
                className="w-full mt-3 border-2 border-black text-black py-4 text-sm font-mono tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-100"
              >
                이전 응답 수정하기
              </button>
            )}
          </div>

        /* Step 2: time selection */
        ) : (
          <div className="pt-10">
            <div className="flex items-baseline justify-between mb-8">
              <p className="font-mono text-xs tracking-widest uppercase text-dim">
                02 — 불가능한 시간 선택
              </p>
              <button
                onClick={() => setStep(1)}
                className="font-mono text-xs tracking-widest uppercase border-b border-transparent hover:border-black transition-all duration-100 pb-0.5 text-dim"
              >
                ← 정보 수정
              </button>
            </div>

            <p className="text-sm text-dim mb-6">
              <strong className="text-black font-serif">{name}</strong>님,
              참석 불가능한 시간을 탭하거나 드래그하여 선택하세요.<br />
              <span className="font-mono text-xs">■ = 불가 &nbsp; □ = 가능</span>
            </p>

            <HourlyDragGrid
              dates={dates}
              unavailableSlots={unavailableSlots}
              setUnavailableSlots={setUnavailableSlots}
            />

            {submitError && (
              <p className="font-mono text-xs mt-4">⚠ {submitError}</p>
            )}

            <div className="h-[3px] bg-black mt-8 mb-6" />

            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="w-full bg-black text-white py-4 text-sm font-mono tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              {submitLoading ? "제출 중..." : "응답 제출 →"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
