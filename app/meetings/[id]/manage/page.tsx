"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, CheckCircle, RefreshCw, Users, Share2 } from "lucide-react";

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
  return new Date(dateStr.split("T")[0] + "T00:00:00");
}

function formatDate(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
}

function formatDateShort(dateStr: string): string {
  return toLocalDate(dateStr).toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
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
      {/* Date tab track — inset pill */}
      <div className="bg-base neu-deep rounded-2xl p-1.5 flex gap-1 overflow-x-auto mb-6">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              onClick={() => setTimeViewDate(date)}
              className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl transition-all duration-300 min-w-[56px] ${
                isActive
                  ? "bg-base neu-raised-sm text-fore"
                  : "text-muted hover:text-fore"
              }`}
            >
              <span className="text-xs font-medium">
                {WEEKDAY_NAMES[d.getDay()]}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {d.getMonth() + 1}/{d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="space-y-2">
        {HOURS_ALL.map((hour) => {
          const unavailable = meeting.participants.filter((p) =>
            p.unavailableSlots.some((s) => s.date === activeDate && s.timeSlot === String(hour))
          );
          const total = meeting.totalParticipants;
          const availCount = total - unavailable.length;
          const ratio = total > 0 ? availCount / total : 0;

          return (
            <div key={hour} className="flex items-center gap-4 px-1">
              <span className="font-display text-xs text-muted w-10 shrink-0 tabular-nums">
                {hour}:00
              </span>
              <div className="flex-1 flex items-center gap-3">
                {/* Progress track — inset */}
                <div className="flex-1 h-2 bg-base neu-inset-sm rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ratio * 100}%`,
                      background: ratio > 0.8
                        ? "#38B2AC"
                        : ratio > 0.5
                        ? "#6C63FF"
                        : "#A0AEC0",
                    }}
                  />
                </div>
                <span className="font-display text-xs tabular-nums text-muted w-14 text-right">
                  {availCount}/{total}명
                </span>
              </div>
              {unavailable.length > 0 && (
                <p className="text-xs text-muted hidden sm:block truncate max-w-[120px]">
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
      if (res.ok) setMeeting(data);
      else setError(data.error || "약속 정보를 가져올 수 없습니다.");
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
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setSharedConfirm(true);
    setTimeout(() => setSharedConfirm(false), 2000);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try { await navigator.clipboard.writeText(inviteLink); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !meeting) return;
    setConfirming(true); setConfirmError("");
    try {
      const res = await fetch(`/api/meetings/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedSlot.date, timeSlot: selectedSlot.timeSlot }),
      });
      const data = await res.json();
      if (res.ok) { await fetchMeeting(); setSelectedSlot(null); }
      else setConfirmError(data.error || "약속 확정 중 오류가 발생했습니다.");
    } catch { setConfirmError("서버와 연결할 수 없습니다."); }
    finally { setConfirming(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="neu-card p-8 flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin text-accent" strokeWidth={2} />
          <span className="text-fore font-medium">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <div className="neu-card p-10 text-center max-w-sm w-full">
          <p className="text-fore mb-6">{error || "약속을 찾을 수 없습니다."}</p>
          <Link href="/" className="neu-btn neu-btn-secondary px-6 py-3 text-sm">
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
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-base/80 backdrop-blur-sm py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="neu-card flex items-center justify-between px-6 py-3">
            <Link href="/" className="font-display font-bold text-xl text-fore tracking-tight hover:text-accent transition-colors">
              시간조율
            </Link>
            <span className="flex items-center gap-2 text-xs text-muted">
              <RefreshCw size={12} className="text-muted" />
              10초 자동 갱신
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* Meeting info card */}
        <div className="neu-card p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {meeting.isConfirmed && (
                <span className="inline-flex items-center gap-1.5 bg-base neu-raised-sm rounded-full px-3 py-1 text-xs font-semibold text-success mb-3">
                  <CheckCircle size={12} />
                  확정됨
                </span>
              )}
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-fore tracking-tight leading-tight">
                {meeting.title}
              </h1>
              {meeting.description && (
                <p className="text-muted mt-2">{meeting.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            {[
              { label: "기간", value: `${formatDateShort(meeting.startDate)} — ${formatDateShort(meeting.endDate)}` },
              { label: "마감", value: formatDate(meeting.deadline) },
              { label: "응답", value: `${meeting.totalParticipants}명` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-base neu-inset-sm rounded-2xl p-4">
                <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-medium text-fore">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmed banner */}
        {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
          <div
            className="rounded-[32px] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            style={{
              background: "linear-gradient(135deg, #6C63FF, #8B84FF)",
              boxShadow: "9px 9px 16px rgb(163 177 198 / 0.6), -9px -9px 16px rgba(255,255,255,0.5)",
            }}
          >
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
                Confirmed
              </p>
              <p className="text-white text-2xl font-display font-extrabold">
                {formatDateShort(meeting.confirmedDate)}
              </p>
              <p className="text-white/80 font-display text-lg mt-1">
                {formatSlotLabel(meeting.confirmedSlot)}
              </p>
            </div>
            <button
              onClick={handleShareConfirm}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {sharedConfirm
                ? <><CheckCircle size={16} strokeWidth={2} /> 복사됨</>
                : <><Share2 size={16} strokeWidth={2} /> 공유하기</>
              }
            </button>
          </div>
        )}

        {/* Invite link */}
        <div className="neu-card p-7">
          <h2 className="font-display font-bold text-fore mb-4">초대 링크</h2>
          <div className="flex gap-3">
            <div className="flex-1 neu-deep rounded-2xl px-4 py-3 text-sm text-muted font-mono truncate min-w-0">
              {inviteLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="neu-btn neu-btn-secondary px-4 py-3 text-sm shrink-0"
            >
              {copied
                ? <><CheckCircle size={16} strokeWidth={2} className="text-success" /> 복사됨</>
                : <><Copy size={16} strokeWidth={2} /> 복사</>
              }
            </button>
          </div>
          <Link
            href={`/invite/${meeting.token}`}
            className="mt-4 w-full neu-btn neu-btn-secondary py-3 text-sm"
          >
            나도 응답하기 →
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Optimal slots */}
          <div className="neu-card p-7">
            <h2 className="font-display font-bold text-fore mb-5">추천 시간대</h2>

            {meeting.totalParticipants === 0 ? (
              <div className="neu-deep rounded-2xl p-6 text-center">
                <p className="text-muted text-sm">아직 응답이 없습니다. 초대 링크를 공유하세요.</p>
              </div>
            ) : meeting.optimalSlots.length === 0 ? (
              <div className="neu-deep rounded-2xl p-6 text-center">
                <p className="text-muted text-sm">추천할 시간대가 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {displayedSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.date === slot.date && selectedSlot?.timeSlot === slot.timeSlot;
                    const isConfirmed = meeting.isConfirmed && meeting.confirmedDate === slot.date && meeting.confirmedSlot === slot.timeSlot;
                    const isTop = index === 0;

                    return (
                      <button
                        key={`${slot.date}-${slot.timeSlot}`}
                        onClick={() => !meeting.isConfirmed && setSelectedSlot(isSelected ? null : slot)}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 text-left ${
                          isConfirmed
                            ? "bg-success/10 neu-raised-sm"
                            : isSelected
                            ? "bg-base neu-deep"
                            : isTop
                            ? "bg-base neu-raised-sm hover:-translate-y-0.5 hover:shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]"
                            : "bg-base neu-inset-sm hover:neu-raised-sm"
                        } ${meeting.isConfirmed ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isConfirmed
                                ? "bg-success/20 neu-inset-sm"
                                : isTop
                                ? "bg-base neu-deep"
                                : "bg-base neu-inset-sm"
                            }`}
                          >
                            <span className={`font-display text-sm font-bold ${
                              isConfirmed ? "text-success" : isTop ? "text-accent" : "text-muted"
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-fore">
                              {formatDateShort(slot.date)}
                            </p>
                            <p className="text-xs text-muted font-display mt-0.5">
                              {formatSlotLabel(slot.timeSlot)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold font-display ${
                            isConfirmed ? "text-success" : "text-accent"
                          }`}>
                            {slot.availableCount}명
                          </p>
                          <p className="text-xs text-muted">/{meeting.totalParticipants}명</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {meeting.optimalSlots.length > 5 && (
                  <button
                    onClick={() => setShowAllSlots(v => !v)}
                    className="mt-3 w-full neu-btn neu-btn-secondary py-3 text-sm"
                  >
                    {showAllSlots ? "접기" : `더보기 (${meeting.optimalSlots.length - 5}개)`}
                  </button>
                )}

                {!meeting.isConfirmed && selectedSlot && (
                  <div className="mt-5 pt-5 border-t border-base/50">
                    {confirmError && (
                      <p className="text-sm text-muted mb-3">⚠ {confirmError}</p>
                    )}
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="neu-btn neu-btn-primary w-full py-4 text-sm"
                    >
                      <CheckCircle size={16} strokeWidth={2} />
                      {confirming ? "확정 중..." : "이 시간으로 확정"}
                    </button>
                    <p className="text-xs text-muted text-center mt-2">
                      {formatDateShort(selectedSlot.date)} · {formatSlotLabel(selectedSlot.timeSlot)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Participant / time tab panel */}
          <div className="neu-card p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-fore flex items-center gap-2">
                <Users size={18} strokeWidth={1.5} className="text-accent" />
                응답 현황 ({meeting.totalParticipants}명)
              </h2>
              {/* Tab track — inset pill */}
              <div className="bg-base neu-deep rounded-2xl p-1 flex">
                {(["person", "time"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      viewTab === tab
                        ? "bg-base neu-raised-sm text-fore"
                        : "text-muted hover:text-fore"
                    }`}
                  >
                    {tab === "person" ? "사람별" : "시간별"}
                  </button>
                ))}
              </div>
            </div>

            {meeting.participants.length === 0 ? (
              <div className="neu-deep rounded-2xl p-6 text-center">
                <p className="text-muted text-sm">아직 응답한 참가자가 없습니다.</p>
              </div>
            ) : viewTab === "person" ? (
              <div className="space-y-3">
                {meeting.participants.map((p) => {
                  const grouped = p.unavailableSlots.reduce<Record<string, string[]>>((acc, s) => {
                    if (!acc[s.date]) acc[s.date] = [];
                    acc[s.date].push(s.timeSlot);
                    return acc;
                  }, {});
                  const sortedDates = Object.keys(grouped).sort();

                  return (
                    <div key={p.id} className="bg-base neu-inset-sm rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-base neu-raised-sm flex items-center justify-center">
                            <span className="text-xs font-bold text-accent">
                              {p.name[0]}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-fore">{p.name}</span>
                          <span className="text-xs text-muted">{p.phone}</span>
                        </div>
                        <span className="text-xs text-muted">
                          불가 {p.unavailableSlots.length}시간
                        </span>
                      </div>
                      {sortedDates.length === 0 ? (
                        <p className="text-xs text-success font-medium">모든 시간 가능</p>
                      ) : (
                        <div className="space-y-1 mt-2">
                          {sortedDates.map((date) => (
                            <div key={date} className="text-xs text-muted">
                              <span className="text-fore font-medium">{formatDateShort(date)}:</span>{" "}
                              {grouped[date].map(Number).sort((a, b) => a - b).map((h) => `${h}:00`).join(", ")}
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
