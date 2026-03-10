"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, CheckCircle, RefreshCw, Users, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      {/* Date tab track */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              onClick={() => setTimeViewDate(date)}
              className={cn(
                "flex min-w-[52px] shrink-0 flex-col items-center rounded-lg px-3 py-2 transition-all duration-200",
                isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-xs font-medium">{WEEKDAY_NAMES[d.getDay()]}</span>
              <span className="tabular-nums text-sm font-bold">
                {d.getMonth() + 1}/{d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {HOURS_ALL.map((hour) => {
          const unavailable = meeting.participants.filter((p) =>
            p.unavailableSlots.some((s) => s.date === activeDate && s.timeSlot === String(hour))
          );
          const total = meeting.totalParticipants;
          const availCount = total - unavailable.length;
          const ratio = total > 0 ? availCount / total : 0;

          return (
            <div key={hour} className="flex items-center gap-3 px-1">
              <span className="font-display w-10 shrink-0 tabular-nums text-xs text-muted-foreground">
                {hour}:00
              </span>
              <div className="flex flex-1 items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ratio * 100}%`,
                      background:
                        ratio > 0.8 ? "#34D399" : ratio > 0.5 ? "oklch(0.83 0.11 196)" : "rgba(255,255,255,0.2)",
                    }}
                  />
                </div>
                <span className="font-display w-14 text-right tabular-nums text-xs text-muted-foreground">
                  {availCount}/{total}명
                </span>
              </div>
              {unavailable.length > 0 && (
                <p className="hidden max-w-[120px] truncate text-xs text-muted-foreground sm:block">
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
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

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

  const handleShareConfirm = useCallback(async (m: Meeting) => {
    if (!m.confirmedDate || !m.confirmedSlot) return;
    const link = typeof window !== "undefined" ? `${window.location.origin}/invite/${m.token}` : "";
    const text = `📅 약속이 확정되었습니다!\n\n${m.title}\n${formatDate(m.confirmedDate)} ${formatSlotLabel(m.confirmedSlot)}\n\n${link}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: m.title, text });
        return;
      } catch {}
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
  }, []);

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        const updated: Meeting = {
          ...meeting,
          isConfirmed: true,
          confirmedDate: selectedSlot.date,
          confirmedSlot: selectedSlot.timeSlot,
        };
        setSelectedSlot(null);
        handleShareConfirm(updated);
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-6">
          <CardContent className="flex items-center gap-3 p-0">
            <RefreshCw size={18} className="animate-spin text-primary" strokeWidth={2} />
            <span className="font-medium text-foreground">불러오는 중...</span>
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

  const displayedSlots = showAllSlots ? meeting.optimalSlots : meeting.optimalSlots.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <RefreshCw size={12} />
          10초 자동 갱신
        </span>
      </Header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">

        {/* Meeting info */}
        <Card className="p-6">
          <CardContent className="p-0">
            {meeting.isConfirmed && (
              <span
                className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34D399" }}
              >
                <CheckCircle size={11} />
                확정됨
              </span>
            )}
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {meeting.title}
            </h1>
            {meeting.description && (
              <p className="mt-1 text-sm text-muted-foreground">{meeting.description}</p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {[
                { label: "기간", value: `${formatDateShort(meeting.startDate)} — ${formatDateShort(meeting.endDate)}` },
                { label: "마감", value: formatDate(meeting.deadline) },
                { label: "응답", value: `${meeting.totalParticipants}명` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-muted/40 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confirmed banner */}
        {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
          <div
            className="flex flex-col gap-4 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "rgba(68,220,234,0.07)",
              border: "1px solid rgba(68,220,234,0.25)",
            }}
          >
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/60">
                Confirmed
              </p>
              <p className="font-display text-xl font-bold text-foreground">
                {formatDateShort(meeting.confirmedDate)}
              </p>
              <p className="font-display text-base text-primary">
                {formatSlotLabel(meeting.confirmedSlot)}
              </p>
            </div>
            <Button
              onClick={() => handleShareConfirm(meeting)}
              variant="outline"
              className="shrink-0 gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              {sharedConfirm ? (
                <><CheckCircle size={15} /> 복사됨</>
              ) : (
                <><Share2 size={15} /> 공유하기</>
              )}
            </Button>
          </div>
        )}

        {/* Invite link */}
        <Card className="p-6">
          <CardContent className="p-0">
            <h2 className="font-display mb-4 font-bold text-foreground">초대 링크</h2>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/30 px-3 py-2.5 font-mono text-sm text-muted-foreground">
                {inviteLink}
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="shrink-0 gap-1.5"
              >
                {copied ? (
                  <><CheckCircle size={15} className="text-green-400" /> 복사됨</>
                ) : (
                  <><Copy size={15} /> 복사</>
                )}
              </Button>
            </div>
            <Link
              href={`/invite/${meeting.token}`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full h-10")}
            >
              나도 응답하기 →
            </Link>
          </CardContent>
        </Card>

        {/* Two-column layout */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Optimal slots */}
          <Card className="p-6">
            <CardContent className="p-0">
              <h2 className="font-display mb-1 font-bold text-foreground">추천 시간대</h2>
              <p className="mb-4 text-xs text-muted-foreground">시간을 누르면 참석 가능한 사람을 볼 수 있어요</p>

              {meeting.totalParticipants === 0 ? (
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    아직 응답이 없습니다. 초대 링크를 공유하세요.
                  </p>
                </div>
              ) : meeting.optimalSlots.length === 0 ? (
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">추천할 시간대가 없습니다.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {displayedSlots.map((slot, index) => {
                      const slotKey = `${slot.date}-${slot.timeSlot}`;
                      const isSelected =
                        selectedSlot?.date === slot.date &&
                        selectedSlot?.timeSlot === slot.timeSlot;
                      const isConfirmed =
                        meeting.isConfirmed &&
                        meeting.confirmedDate === slot.date &&
                        meeting.confirmedSlot === slot.timeSlot;
                      const isTop = index === 0;

                      const availablePeople = meeting.participants.filter(
                        (p) =>
                          !p.unavailableSlots.some(
                            (s) => s.date === slot.date && s.timeSlot === slot.timeSlot
                          )
                      );

                      return (
                        <div key={slotKey}>
                          <button
                            onClick={() =>
                              !meeting.isConfirmed && setSelectedSlot(isSelected ? null : slot)
                            }
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all duration-200",
                              !meeting.isConfirmed && !isSelected && "hover:-translate-y-0.5",
                              meeting.isConfirmed && "cursor-default"
                            )}
                            style={
                              isConfirmed
                                ? { background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)" }
                                : isSelected
                                ? { background: "rgba(68,220,234,0.08)", border: "1px solid rgba(68,220,234,0.3)" }
                                : isTop
                                ? { background: "rgba(68,220,234,0.06)", border: "1px solid rgba(68,220,234,0.18)" }
                                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={
                                  isConfirmed
                                    ? { background: "rgba(52,211,153,0.15)" }
                                    : isTop
                                    ? { background: "rgba(68,220,234,0.15)" }
                                    : { background: "rgba(255,255,255,0.06)" }
                                }
                              >
                                <span
                                  className={cn(
                                    "font-display text-xs font-bold",
                                    isConfirmed ? "text-green-400" : isTop ? "text-primary" : "text-muted-foreground"
                                  )}
                                >
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {formatDateShort(slot.date)}
                                </p>
                                <p className="font-display mt-0.5 text-xs text-muted-foreground">
                                  {formatSlotLabel(slot.timeSlot)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p
                                  className={cn(
                                    "font-display text-sm font-bold",
                                    isConfirmed ? "text-green-400" : "text-primary"
                                  )}
                                >
                                  {slot.availableCount}명
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  /{meeting.totalParticipants}명
                                </p>
                              </div>
                              {!meeting.isConfirmed && (
                                <span className="text-muted-foreground">
                                  {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Expanded panel */}
                          {isSelected && !meeting.isConfirmed && (
                            <div
                              className="mt-1 rounded-xl p-4"
                              style={{
                                background: "rgba(68,220,234,0.05)",
                                border: "1px solid rgba(68,220,234,0.15)",
                              }}
                            >
                              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                                참석 가능 ({availablePeople.length}명)
                              </p>
                              {availablePeople.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  이 시간에 가능한 사람이 없습니다.
                                </p>
                              ) : (
                                <div className="mb-4 flex flex-wrap gap-2">
                                  {availablePeople.map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                                      style={{
                                        background: "rgba(68,220,234,0.1)",
                                        border: "1px solid rgba(68,220,234,0.2)",
                                      }}
                                    >
                                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                                        <span className="text-[10px] font-bold text-primary-foreground">
                                          {p.name[0]}
                                        </span>
                                      </div>
                                      <span className="text-xs font-semibold text-foreground">
                                        {p.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {confirmError && (
                                <p className="mb-2 text-xs text-red-400">⚠ {confirmError}</p>
                              )}
                              <Button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="w-full h-10 gap-2 text-sm"
                              >
                                <CheckCircle size={15} strokeWidth={2} />
                                {confirming ? "확정 중..." : "이 시간으로 확정하기"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {meeting.optimalSlots.length > 5 && (
                    <Button
                      onClick={() => setShowAllSlots((v) => !v)}
                      variant="outline"
                      className="mt-3 w-full h-10"
                    >
                      {showAllSlots ? "접기" : `더보기 (${meeting.optimalSlots.length - 5}개)`}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Participant / time tab panel */}
          <Card className="p-6">
            <CardContent className="p-0">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display flex items-center gap-2 font-bold text-foreground">
                  <Users size={15} strokeWidth={1.5} className="text-primary" />
                  응답 현황 ({meeting.totalParticipants}명)
                </h2>
                <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                  {(["person", "time"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                        viewTab === tab
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab === "person" ? "사람별" : "시간별"}
                    </button>
                  ))}
                </div>
              </div>

              {meeting.participants.length === 0 ? (
                <div className="rounded-xl bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">아직 응답한 참가자가 없습니다.</p>
                </div>
              ) : viewTab === "person" ? (
                <div className="space-y-2">
                  <p className="mb-3 text-xs text-muted-foreground">사람을 누르면 가능한 시간을 볼 수 있어요</p>
                  {meeting.participants.map((p) => {
                    const isExpanded = expandedPersonId === p.id;
                    const dates = getDateRange(meeting.startDate, meeting.endDate);
                    const unavailSet = new Set(p.unavailableSlots.map((s) => `${s.date}-${s.timeSlot}`));
                    const availByDate: Record<string, number[]> = {};
                    for (const date of dates) {
                      const hrs = HOURS_ALL.filter((h) => !unavailSet.has(`${date}-${String(h)}`));
                      if (hrs.length > 0) availByDate[date] = hrs;
                    }
                    const availDates = Object.keys(availByDate).sort();
                    const totalAvail = Object.values(availByDate).reduce((s, v) => s + v.length, 0);

                    return (
                      <div key={p.id}>
                        <button
                          onClick={() => setExpandedPersonId(isExpanded ? null : p.id)}
                          className={cn(
                            "w-full rounded-xl p-3.5 text-left transition-all duration-200",
                            !isExpanded && "hover:-translate-y-0.5"
                          )}
                          style={
                            isExpanded
                              ? { background: "rgba(68,220,234,0.06)", border: "1px solid rgba(68,220,234,0.18)" }
                              : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                                <span className="text-xs font-bold text-primary-foreground">{p.name[0]}</span>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-foreground">{p.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{p.phone}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">
                                가능 {totalAvail}시간
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={14} className="text-muted-foreground" />
                              ) : (
                                <ChevronDown size={14} className="text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div
                            className="mt-1 rounded-xl p-4"
                            style={{
                              background: "rgba(68,220,234,0.04)",
                              border: "1px solid rgba(68,220,234,0.12)",
                            }}
                          >
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                              가능한 시간
                            </p>
                            {availDates.length === 0 ? (
                              <p className="text-xs text-muted-foreground">가능한 시간이 없습니다.</p>
                            ) : (
                              <div className="space-y-3">
                                {availDates.map((date) => (
                                  <div key={date}>
                                    <p className="mb-2 text-xs font-semibold text-foreground">
                                      {formatDateShort(date)}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {availByDate[date].map((h) => (
                                        <span
                                          key={h}
                                          className="font-display rounded-lg px-2.5 py-1 tabular-nums text-xs font-semibold text-primary"
                                          style={{
                                            background: "rgba(68,220,234,0.1)",
                                            border: "1px solid rgba(68,220,234,0.2)",
                                          }}
                                        >
                                          {h}:00
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
