"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Copy,
  CheckCircle,
  Users,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Calendar,
} from "lucide-react";

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

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
        body: JSON.stringify({
          date: selectedSlot.date,
          timeSlot: selectedSlot.timeSlot,
        }),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "약속을 찾을 수 없습니다."}</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Clock className="w-5 h-5 text-indigo-600" />
          <span className="text-lg font-bold text-indigo-700">시간 조율</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Meeting Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {meeting.isConfirmed && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    확정됨
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              {meeting.description && (
                <p className="text-gray-600 mt-1">{meeting.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">약속 기간</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDateShort(meeting.startDate)} ~ {formatDateShort(meeting.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">응답 마감</p>
              <p className="text-sm font-medium text-gray-800">
                {formatDate(meeting.deadline)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">응답 현황</p>
              <p className="text-sm font-medium text-gray-800">
                {meeting.totalParticipants}명 응답
              </p>
            </div>
          </div>

          {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">약속 확정</span>
              </div>
              <p className="text-green-800 mt-1">
                {formatDateShort(meeting.confirmedDate)} ·{" "}
                {formatSlotLabel(meeting.confirmedSlot)}
              </p>
            </div>
          )}
        </div>

        {/* Invite Link */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-indigo-600" />
            초대 링크
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  링크 복사
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            이 링크를 참가자들에게 공유하세요.
          </p>
          <Link
            href={`/invite/${meeting.token}`}
            className="mt-3 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            나도 응답하기
          </Link>
          <p className="text-xs text-gray-500 mt-1 text-center">
            주최자도 불가능한 시간을 직접 응답할 수 있습니다.
          </p>
        </div>

        {/* Optimal Time Slots */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            추천 시간대
          </h2>
          {meeting.totalParticipants === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              아직 응답이 없습니다. 초대 링크를 공유하세요.
            </p>
          ) : meeting.optimalSlots.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              추천할 시간대가 없습니다.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {(showAllSlots ? meeting.optimalSlots : meeting.optimalSlots.slice(0, 5)).map((slot, index) => {
                  const isSelected =
                    selectedSlot?.date === slot.date &&
                    selectedSlot?.timeSlot === slot.timeSlot;
                  const isConfirmed =
                    meeting.isConfirmed &&
                    meeting.confirmedDate === slot.date &&
                    meeting.confirmedSlot === slot.timeSlot;

                  return (
                    <button
                      key={`${slot.date}-${slot.timeSlot}`}
                      onClick={() =>
                        !meeting.isConfirmed &&
                        setSelectedSlot(isSelected ? null : slot)
                      }
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isConfirmed
                          ? "border-green-500 bg-green-50"
                          : isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50"
                      } ${meeting.isConfirmed ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          index === 0
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateShort(slot.date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatSlotLabel(slot.timeSlot)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          isConfirmed ? "text-green-700" : "text-indigo-700"
                        }`}>
                          {slot.availableCount}명 가능
                        </p>
                        {meeting.totalParticipants > 0 && (
                          <p className="text-xs text-gray-400">
                            전체 {meeting.totalParticipants}명 중
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {meeting.optimalSlots.length > 5 && (
                <button
                  onClick={() => setShowAllSlots((v) => !v)}
                  className="mt-3 w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  {showAllSlots ? "접기" : `더보기 (${meeting.optimalSlots.length - 5}개 더)`}
                </button>
              )}
            </>
          )}

          {!meeting.isConfirmed && selectedSlot && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {confirmError && (
                <p className="text-red-600 text-sm mb-3">{confirmError}</p>
              )}
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {confirming ? "확정 중..." : "이 시간으로 약속 확정"}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {formatDateShort(selectedSlot.date)} ·{" "}
                {formatSlotLabel(selectedSlot.timeSlot)}
              </p>
            </div>
          )}
        </div>

        {/* Participant / Time View Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">
              응답 현황 ({meeting.totalParticipants}명)
            </h2>
            <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewTab("person")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewTab === "person" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                사람별
              </button>
              <button
                onClick={() => setViewTab("time")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewTab === "time" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                시간별
              </button>
            </div>
          </div>

          {meeting.participants.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              아직 응답한 참가자가 없습니다.
            </p>
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
                  <div key={p.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{p.phone}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        불가 {p.unavailableSlots.length}시간
                      </span>
                    </div>
                    {sortedDates.length === 0 ? (
                      <p className="text-xs text-green-600">모든 시간 가능</p>
                    ) : (
                      <div className="space-y-1 mt-2">
                        {sortedDates.map((date) => (
                          <div key={date} className="text-xs text-gray-600">
                            <span className="font-medium text-gray-700">{formatDateShort(date)}: </span>
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
            <TimeView meeting={meeting} timeViewDate={timeViewDate} setTimeViewDate={setTimeViewDate} />
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3" />
            10초마다 자동 새로고침
          </p>
        </div>
      </main>
    </div>
  );
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
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-6 px-6">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              onClick={() => setTimeViewDate(date)}
              className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors min-w-[52px] ${
                isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className={`text-xs font-medium ${
                isActive ? "text-indigo-200" : isWeekend ? "text-red-400" : "text-gray-500"
              }`}>
                {WEEKDAY_NAMES[d.getDay()]}
              </span>
              <span className="text-sm font-bold">{d.getMonth() + 1}/{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="space-y-1">
        {HOURS_ALL.map((hour) => {
          const unavailable = meeting.participants.filter((p) =>
            p.unavailableSlots.some((s) => s.date === activeDate && s.timeSlot === String(hour))
          );
          const available = meeting.participants.filter((p) =>
            !p.unavailableSlots.some((s) => s.date === activeDate && s.timeSlot === String(hour))
          );
          const availCount = available.length;
          const total = meeting.totalParticipants;

          return (
            <div key={hour} className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-gray-50">
              <span className="text-sm font-mono text-gray-500 w-12 shrink-0 mt-0.5">{hour}:00</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: total > 0 ? `${(availCount / total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${
                    availCount === total ? "text-green-600" : availCount === 0 ? "text-red-500" : "text-indigo-600"
                  }`}>
                    {availCount}/{total}명
                  </span>
                </div>
                {unavailable.length > 0 && (
                  <p className="text-xs text-red-400 truncate">
                    불가: {unavailable.map((p) => p.name).join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
