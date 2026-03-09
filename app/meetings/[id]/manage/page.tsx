"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, CheckCircle, RefreshCw } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  unavailableSlots: { date: string; timeSlot: string }[];
}

interface OptimalSlot {
  date: string;
  timeSlot: string;
  availableCount: number;
  unavailableCount: number;
}

interface Meeting {
  id: string;
  token: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  deadline: string;
  isConfirmed: boolean;
  confirmedDate: string | null;
  confirmedSlot: string | null;
  participants: Participant[];
  totalParticipants: number;
  optimalSlots: OptimalSlot[];
}

function formatSlotLabel(timeSlot: string): string {
  const h = parseInt(timeSlot);
  if (isNaN(h)) return timeSlot;
  return `${h}:00`;
}

function toLocalDate(dateStr: string): Date {
  const ymd = dateStr.split("T")[0];
  return new Date(ymd + "T00:00:00");
}

function formatDate(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatDateShort(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

const HOURS_ALL = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate.split("T")[0] + "T00:00:00");
  const end = new Date(endDate.split("T")[0] + "T00:00:00");
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function TimeView({
  meeting,
  timeViewDate,
  setTimeViewDate,
}: {
  meeting: Meeting;
  timeViewDate: string;
  setTimeViewDate: (d: string) => void;
}) {
  const dates = getDateRange(meeting.startDate, meeting.endDate);
  const activeDate = timeViewDate || dates[0] || "";

  return (
    <div>
      {/* Date tabs */}
      <div className="flex gap-px overflow-x-auto pb-2 mb-6 border border-black">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              onClick={() => setTimeViewDate(date)}
              className={`shrink-0 flex flex-col items-center px-4 py-3 transition-colors duration-100 min-w-[56px] ${
                isActive ? "bg-black text-white" : "bg-white text-black hover:bg-muted"
              }`}
            >
              <span className="font-mono text-xs">
                {WEEKDAY_NAMES[d.getDay()]}
              </span>
              <span className="font-mono text-sm font-bold">{d.getMonth() + 1}/{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="divide-y divide-subtle">
        {HOURS_ALL.map((hour) => {
          const unavailable = meeting.participants.filter((p) =>
            p.unavailableSlots.some((s) => s.date === activeDate && s.timeSlot === String(hour))
          );
          const available = meeting.participants.filter((p) =>
            !p.unavailableSlots.some((s) => s.date === activeDate && s.timeSlot === String(hour))
          );
          const total = meeting.totalParticipants;
          const availCount = available.length;
          const ratio = total > 0 ? availCount / total : 0;

          return (
            <div key={hour} className="flex items-center gap-4 py-2.5">
              <span className="font-mono text-xs text-dim w-10 shrink-0 tabular-nums">
                {hour}:00
              </span>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-subtle">
                  <div
                    className="h-full bg-black transition-all duration-100"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs tabular-nums w-12 text-right text-dim">
                  {availCount}/{total}명
                </span>
              </div>
              {unavailable.length > 0 && (
                <p className="font-mono text-xs text-dim hidden sm:block truncate max-w-[140px]">
                  {unavailable.map((p) => p.name).join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ManagePage() {
  const params = useParams();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<OptimalSlot | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [viewTab, setViewTab] = useState<"person" | "time">("person");
  const [timeViewDate, setTimeViewDate] = useState("");
  const [sharedConfirm, setSharedConfirm] = useState(false);

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      const data = await res.json();
      if (res.ok) {
        setMeeting(data);
      } else {
        setError(data.error || "약속 정보를 가져올 수 없습니다.");
      }
    } catch {
      setError("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeeting();
    const interval = setInterval(fetchMeeting, 10000);
    return () => clearInterval(interval);
  }, [fetchMeeting]);

  const inviteLink =
    typeof window !== "undefined" && meeting
      ? `${window.location.origin}/invite/${meeting.token}`
      : "";

  const handleShareConfirm = async () => {
    if (!meeting?.confirmedDate || !meeting?.confirmedSlot) return;
    const text = `📅 약속이 확정되었습니다!\n\n${meeting.title}\n${formatDate(meeting.confirmedDate)} ${formatSlotLabel(meeting.confirmedSlot)}\n\n${inviteLink}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: meeting.title, text }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setSharedConfirm(true);
    setTimeout(() => setSharedConfirm(false), 2000);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !meeting) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const res = await fetch(`/api/meetings/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedSlot.date, timeSlot: selectedSlot.timeSlot }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchMeeting();
        setSelectedSlot(null);
      } else {
        setConfirmError(data.error || "약속 확정 중 오류가 발생했습니다.");
      }
    } catch {
      setConfirmError("서버와 연결할 수 없습니다.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-dim tracking-widest uppercase">
          <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.5} />
          불러오는 중
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <p className="font-mono text-sm mb-6">{error || "약속을 찾을 수 없습니다."}</p>
          <Link href="/" className="font-mono text-xs tracking-widest uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity duration-100">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const displayedSlots = showAllSlots
    ? meeting.optimalSlots
    : meeting.optimalSlots.slice(0, 5);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-widest uppercase hover:opacity-60 transition-opacity duration-100"
          >
            시간조율
          </Link>
          <span className="font-mono text-xs text-dim tracking-widest uppercase flex items-center gap-2">
            <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
            10초 자동 갱신
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-0">

        {/* ── Meeting title block ── */}
        <div className="pb-10 border-b border-black">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {meeting.isConfirmed && (
                <p className="font-mono text-xs tracking-widest uppercase mb-3">
                  ✓ 확정됨
                </p>
              )}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                {meeting.title}
              </h1>
              {meeting.description && (
                <p className="text-dim mt-2 leading-relaxed">{meeting.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-8">
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
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-dim mb-1">응답</p>
              <p className="text-sm font-medium">{meeting.totalParticipants}명</p>
            </div>
          </div>
        </div>

        {/* ── Confirmed banner (inverted) ── */}
        {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
          <div className="relative bg-black text-white overflow-hidden texture-invert">
            <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-white/50 mb-3">
                  Confirmed
                </p>
                <p className="font-serif text-2xl sm:text-3xl font-bold">
                  {formatDateShort(meeting.confirmedDate)}
                </p>
                <p className="font-mono text-lg mt-1 text-white/70">
                  {formatSlotLabel(meeting.confirmedSlot)}
                </p>
              </div>
              <button
                onClick={handleShareConfirm}
                className="flex items-center gap-2 border border-white/40 text-white px-6 py-3 text-sm font-mono tracking-widest uppercase hover:bg-white hover:text-black transition-colors duration-100 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                {sharedConfirm ? (
                  <><CheckCircle className="w-4 h-4" strokeWidth={1.5} /> 복사됨</>
                ) : (
                  <><Copy className="w-4 h-4" strokeWidth={1.5} /> 공유하기</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Invite link ── */}
        <div className="py-10 border-b border-black">
          <p className="font-mono text-xs tracking-widest uppercase text-dim mb-4">
            초대 링크
          </p>
          <div className="flex gap-0 border border-black">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 px-4 py-3 text-sm font-mono bg-muted text-dim focus:outline-none min-w-0"
            />
            <button
              onClick={handleCopyLink}
              className="shrink-0 flex items-center gap-2 bg-black text-white px-5 py-3 text-xs font-mono tracking-widest uppercase hover:bg-white hover:text-black border-l border-black transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              {copied ? (
                <><CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> 복사됨</>
              ) : (
                <><Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> 복사</>
              )}
            </button>
          </div>
          <Link
            href={`/invite/${meeting.token}`}
            className="inline-flex items-center gap-2 mt-4 font-mono text-xs tracking-widest uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity duration-100"
          >
            나도 응답하기 →
          </Link>
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-black pt-10">

          {/* Left: Optimal slots */}
          <div className="lg:pr-10 pb-10 lg:pb-0">
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-6">
              추천 시간대
            </p>

            {meeting.totalParticipants === 0 ? (
              <p className="font-mono text-sm text-dim">
                아직 응답이 없습니다.
              </p>
            ) : meeting.optimalSlots.length === 0 ? (
              <p className="font-mono text-sm text-dim">
                추천할 시간대가 없습니다.
              </p>
            ) : (
              <>
                <div className="divide-y divide-subtle border-y border-black">
                  {displayedSlots.map((slot, index) => {
                    const isSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.timeSlot === slot.timeSlot;
                    const isConfirmed =
                      meeting.isConfirmed &&
                      meeting.confirmedDate === slot.date &&
                      meeting.confirmedSlot === slot.timeSlot;
                    const isTop = index === 0;

                    return (
                      <button
                        key={`${slot.date}-${slot.timeSlot}`}
                        onClick={() =>
                          !meeting.isConfirmed &&
                          setSelectedSlot(isSelected ? null : slot)
                        }
                        className={`w-full flex items-center justify-between px-4 py-4 transition-colors duration-100 text-left group ${
                          isConfirmed
                            ? "bg-black text-white"
                            : isSelected
                            ? "bg-black text-white"
                            : isTop
                            ? "bg-muted hover:bg-black hover:text-white"
                            : "bg-white hover:bg-muted"
                        } ${meeting.isConfirmed ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`font-display text-2xl font-bold leading-none w-8 text-center ${
                            isConfirmed || isSelected
                              ? "text-white/40"
                              : isTop
                              ? "text-black/30"
                              : "text-black/20"
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {formatDateShort(slot.date)}
                            </p>
                            <p className="font-mono text-xs text-dim group-hover:text-white/60 mt-0.5 transition-colors duration-100">
                              {formatSlotLabel(slot.timeSlot)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold tabular-nums">
                            {slot.availableCount}
                            <span className={`font-normal ml-1 ${
                              isConfirmed || isSelected ? "text-white/60" : "text-dim"
                            }`}>
                              / {meeting.totalParticipants}명
                            </span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {meeting.optimalSlots.length > 5 && (
                  <button
                    onClick={() => setShowAllSlots(v => !v)}
                    className="mt-4 w-full border border-black py-3 text-xs font-mono tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                  >
                    {showAllSlots
                      ? "접기"
                      : `더보기 (${meeting.optimalSlots.length - 5}개 더)`}
                  </button>
                )}

                {!meeting.isConfirmed && selectedSlot && (
                  <div className="mt-6 border-t border-black pt-6">
                    {confirmError && (
                      <p className="font-mono text-xs text-dim mb-4">⚠ {confirmError}</p>
                    )}
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="w-full bg-black text-white py-4 text-sm font-mono tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
                    >
                      {confirming ? "확정 중..." : "이 시간으로 확정 →"}
                    </button>
                    <p className="font-mono text-xs text-dim mt-3 text-center">
                      {formatDateShort(selectedSlot.date)} ·{" "}
                      {formatSlotLabel(selectedSlot.timeSlot)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Participant / time tabs */}
          <div className="lg:pl-10 pt-10 lg:pt-0 border-t border-black lg:border-t-0">
            {/* Tab switcher */}
            <div className="flex mb-6">
              <p className="font-mono text-xs tracking-widest uppercase text-dim flex-1 self-center">
                응답 현황 ({meeting.totalParticipants}명)
              </p>
              <div className="flex border border-black">
                {(["person", "time"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={`px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors duration-100 ${
                      viewTab === tab
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-muted"
                    }`}
                  >
                    {tab === "person" ? "사람별" : "시간별"}
                  </button>
                ))}
              </div>
            </div>

            {meeting.participants.length === 0 ? (
              <p className="font-mono text-sm text-dim">
                아직 응답한 참가자가 없습니다.
              </p>
            ) : viewTab === "person" ? (
              <div className="divide-y divide-subtle border-y border-black">
                {meeting.participants.map((p) => {
                  const grouped = p.unavailableSlots.reduce<Record<string, string[]>>((acc, s) => {
                    if (!acc[s.date]) acc[s.date] = [];
                    acc[s.date].push(s.timeSlot);
                    return acc;
                  }, {});
                  const sortedDates = Object.keys(grouped).sort();

                  return (
                    <div key={p.id} className="py-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="flex items-baseline gap-3">
                          <span className="font-serif font-bold">{p.name}</span>
                          <span className="font-mono text-xs text-dim">{p.phone}</span>
                        </div>
                        <span className="font-mono text-xs text-dim tabular-nums">
                          불가 {p.unavailableSlots.length}h
                        </span>
                      </div>
                      {sortedDates.length === 0 ? (
                        <p className="font-mono text-xs text-dim">모든 시간 가능</p>
                      ) : (
                        <div className="space-y-1">
                          {sortedDates.map((date) => (
                            <div key={date} className="font-mono text-xs text-dim">
                              <span className="text-black font-medium">
                                {formatDateShort(date)}:
                              </span>{" "}
                              {grouped[date]
                                .map(Number)
                                .sort((a, b) => a - b)
                                .map((h) => `${h}:00`)
                                .join(", ")}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <TimeView
                meeting={meeting}
                timeViewDate={timeViewDate}
                setTimeViewDate={setTimeViewDate}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
