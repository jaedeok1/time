"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";

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

function slotKey(date: string, hour: number) { return `${date}|${hour}`; }

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
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function formatDate(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function formatHour(h: number) { return `${h}:00`; }

const TIME_GROUPS = [
  { label: "새벽", hours: [0, 1, 2, 3, 4, 5] },
  { label: "오전", hours: [6, 7, 8, 9, 10, 11] },
  { label: "오후", hours: [12, 13, 14, 15, 16, 17] },
  { label: "저녁", hours: [18, 19, 20, 21, 22, 23] },
];

function HourlyDragGrid({
  dates, unavailableSlots, setUnavailableSlots,
}: {
  dates: string[];
  unavailableSlots: Set<string>;
  setUnavailableSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [activeDate, setActiveDate] = useState(dates[0] || "");
  const dragRef = useRef<{ active: boolean; paintValue: boolean } | null>(null);

  const isUnavailable = (date: string, hour: number) => unavailableSlots.has(slotKey(date, hour));

  const applySlot = (key: string, value: boolean) => {
    setUnavailableSlots((prev) => {
      if (prev.has(key) === value) return prev;
      const next = new Set(prev);
      if (value) next.add(key); else next.delete(key);
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
        if (allSelected) next.delete(key); else next.add(key);
      });
      return next;
    });
  };

  const countForDate = (date: string) => HOURS.filter((h) => isUnavailable(date, h)).length;
  const allDaySelected = HOURS.every((h) => isUnavailable(activeDate, h));

  return (
    <div>
      {/* Date tab track */}
      <div className="neu-deep rounded-2xl p-1.5 flex gap-1 overflow-x-auto mb-5">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const count = countForDate(date);
          const isActive = date === activeDate;
          return (
            <button key={date} type="button" onClick={() => setActiveDate(date)}
              className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive ? "neu-raised-sm text-fore" : "text-muted hover:text-fore"
              }`}>
              <span className="text-xs font-medium">{WEEKDAY_NAMES[d.getDay()]}</span>
              <span className="text-sm font-bold tabular-nums">{d.getMonth() + 1}/{d.getDate()}</span>
              {count > 0 && (
                <span className={`text-xs mt-0.5 font-display font-semibold ${isActive ? "text-accent" : "text-muted"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm text-muted">
          {countForDate(activeDate) === 0
            ? "탭하거나 드래그해서 불가 시간 선택"
            : `${countForDate(activeDate)}시간 불가로 표시됨`}
        </p>
        <button type="button" onClick={() => toggleAllDay(activeDate)}
          className="neu-btn neu-btn-secondary px-4 py-2 text-xs">
          {allDaySelected ? "전체 해제" : "하루 전체"}
        </button>
      </div>

      {/* Hour grid */}
      <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} style={{ touchAction: "none" }}>
        {TIME_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-xs font-display font-semibold text-muted uppercase tracking-widest mb-2 px-1">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {group.hours.map((hour) => {
                const unavail = isUnavailable(activeDate, hour);
                const key = slotKey(activeDate, hour);
                return (
                  <div
                    key={hour}
                    data-slot-key={key}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl select-none cursor-pointer transition-all duration-200 ${
                      unavail ? "neu-slot-unavail" : "neu-slot-avail"
                    }`}
                  >
                    <span className={`text-sm font-semibold pointer-events-none tabular-nums ${
                      unavail ? "text-accent" : "text-fore"
                    }`}>
                      {hour}:00
                    </span>
                    <span className={`text-xs font-semibold pointer-events-none ${
                      unavail ? "text-accent/70" : "text-muted"
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
    } catch { setError("서버와 연결할 수 없습니다."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchMeeting(); }, [fetchMeeting]);

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
    if (storedEdit) { setEditToken(storedEdit); setIsEditing(true); setStep(2); return; }
    const storedCreator = localStorage.getItem(`creator-${token}`);
    if (storedCreator) {
      try {
        const { name: cName, phone: cPhone } = JSON.parse(storedCreator);
        setName(cName || ""); setPhone(cPhone || "");
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
    setSubmitError(""); setSubmitLoading(true);
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
          body: JSON.stringify({ name: name.trim(), phone: phone.replace(/[-\s]/g, ""), unavailableSlots: slotsArray }),
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
          if (!stored.some((m: { token: string }) => m.token === token) && meeting) {
            stored.unshift({ token, meetingId: meeting.id, title: meeting.title, respondedAt: new Date().toISOString() });
            localStorage.setItem("my-responded-meetings", JSON.stringify(stored.slice(0, 50)));
          }
        } catch {}
      }
      setSubmitted(true);
    } catch { setSubmitError("서버와 연결할 수 없습니다."); }
    finally { setSubmitLoading(false); }
  };

  const handleEditResponse = () => {
    setIsEditing(true); setSubmitted(false); setStep(2); setUnavailableSlots(new Set());
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="neu-card p-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ border: "1px solid rgba(68,220,234,0.2)", background: "rgba(68,220,234,0.06)" }}>
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
          <p className="text-muted text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <div className="neu-card p-10 text-center max-w-sm w-full">
          <p className="text-fore mb-6">{error || "약속을 찾을 수 없습니다."}</p>
          <Link href="/" className="neu-btn neu-btn-secondary px-6 py-3">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const dates = getDateRange(meeting.startDate, meeting.endDate);

  /* ── Submitted ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <div className="neu-card p-12 sm:p-16 text-center max-w-md w-full">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center neu-glow-pulse"
              style={{
                background: "radial-gradient(circle at 40% 40%, rgba(52,211,153,0.25), rgba(52,211,153,0.06))",
                border: "1px solid rgba(52,211,153,0.4)",
              }}>
              <CheckCircle size={32} strokeWidth={1.5} className="text-success" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-fore mb-2">
            {isEditing ? "응답이 수정되었습니다!" : "응답이 제출되었습니다!"}
          </h1>
          <p className="text-muted mb-8">
            <strong className="text-fore">{meeting.title}</strong> 약속에 응답해 주셨습니다.
          </p>

          <div className="flex flex-col gap-3">
            <Link href={`/meetings/${meeting.id}/manage`} className="neu-btn neu-btn-primary py-4">
              응답 현황 보기
            </Link>
            {editToken && (
              <button onClick={handleEditResponse} className="neu-btn neu-btn-secondary py-4">
                응답 수정하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-50 bg-base/80 backdrop-blur-sm py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="neu-card flex items-center justify-between px-6 py-3">
            <Link href="/" className="font-display font-bold text-xl text-fore tracking-tight hover:text-accent transition-colors">
              시간조율
            </Link>
            <Link href="/" className="neu-btn neu-btn-secondary px-4 py-2">← 홈</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-5">

        {/* Meeting info */}
        <div className="neu-card p-7">
          <h1 className="font-display text-2xl font-bold text-fore tracking-tight mb-2">{meeting.title}</h1>
          {meeting.description && <p className="text-muted text-sm mb-4">{meeting.description}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="neu-inset-sm rounded-xl p-4">
              <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">기간</p>
              <p className="text-sm font-medium text-fore">
                {formatDateShort(meeting.startDate)} — {formatDateShort(meeting.endDate)}
              </p>
            </div>
            <div className="neu-inset-sm rounded-xl p-4">
              <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">마감</p>
              <p className="text-sm font-medium text-fore">{formatDate(meeting.deadline)}</p>
            </div>
          </div>

          {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
            <div className="mt-4 rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(52,211,153,0.15)" }}>
                <CheckCircle size={16} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-success font-semibold mb-0.5">약속 확정</p>
                <p className="text-sm font-medium text-fore">
                  {formatDateShort(meeting.confirmedDate)} · {formatHour(parseInt(meeting.confirmedSlot))}
                </p>
              </div>
            </div>
          )}
        </div>

        {meeting.isConfirmed ? (
          <div className="neu-card p-10 text-center">
            <p className="text-muted">약속 일정이 확정되어 응답을 받지 않습니다.</p>
          </div>

        ) : isEditing ? (
          <div className="neu-card p-7">
            <h2 className="font-display font-bold text-fore mb-2">응답 수정</h2>
            <p className="text-sm text-muted mb-6">불가능한 시간을 탭하거나 드래그하여 선택하세요.</p>
            <HourlyDragGrid dates={dates} unavailableSlots={unavailableSlots} setUnavailableSlots={setUnavailableSlots} />
            {submitError && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2 mt-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}
            <button onClick={handleSubmit} disabled={submitLoading}
              className="neu-btn neu-btn-primary w-full py-4 mt-6">
              {submitLoading ? "저장 중..." : "응답 수정 완료 →"}
            </button>
          </div>

        ) : step === 1 ? (
          <div className="neu-card p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}>
                <span className="font-display text-xs font-bold text-accent">01</span>
              </div>
              <h2 className="font-display font-bold text-fore">참가자 정보</h2>
            </div>

            {namePhoneError && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2 mb-5"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{namePhoneError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-fore mb-2">
                  이름 <span className="text-accent">*</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                  placeholder="이름을 입력하세요" className="neu-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-fore mb-2">
                  전화번호 <span className="text-accent">*</span>
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                  placeholder="01012345678" className="neu-input" />
                <p className="text-xs text-muted mt-2 ml-1">하이픈(-) 없이 숫자만 입력해주세요</p>
              </div>
            </div>

            <button onClick={handleNamePhoneNext} className="neu-btn neu-btn-primary w-full py-4 mt-7">
              다음 →
            </button>
            {editToken && !isEditing && (
              <button onClick={handleEditResponse} className="neu-btn neu-btn-secondary w-full py-4 mt-3">
                이전 응답 수정하기
              </button>
            )}
          </div>

        ) : (
          <div className="neu-card p-7">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}>
                  <span className="font-display text-xs font-bold text-accent">02</span>
                </div>
                <h2 className="font-display font-bold text-fore">불가능한 시간 선택</h2>
              </div>
              <button onClick={() => setStep(1)} className="neu-btn neu-btn-secondary px-3 py-1.5 text-xs">
                ← 정보 수정
              </button>
            </div>

            <p className="text-sm text-muted mb-6 ml-11">
              <strong className="text-fore">{name}</strong>님,
              불가능한 시간을 탭하거나 드래그하여 선택하세요.
            </p>

            <HourlyDragGrid dates={dates} unavailableSlots={unavailableSlots} setUnavailableSlots={setUnavailableSlots} />

            {submitError && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2 mt-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{submitError}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitLoading}
              className="neu-btn neu-btn-primary w-full py-4 mt-6">
              {submitLoading ? "제출 중..." : "응답 제출 →"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
