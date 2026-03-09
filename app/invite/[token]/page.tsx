"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowLeft, CheckCircle, User, Phone, Calendar } from "lucide-react";

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

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23
const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function slotKey(date: string, hour: number) {
  return `${date}|${hour}`;
}

function toLocalDate(dateStr: string): Date {
  // Strip time portion first to avoid timezone shift (e.g. "2026-03-08T00:00:00.000Z" → "2026-03-08")
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

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // Default all slots to unavailable when meeting data loads (new responses only)
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
    if (token) {
      // Check for existing edit token (returning respondent)
      const storedEdit = localStorage.getItem(`editToken-${token}`);
      if (storedEdit) {
        setEditToken(storedEdit);
        setIsEditing(true);
        setStep(2);
        return;
      }
      // Pre-fill name/phone if creator is responding for the first time
      const storedCreator = localStorage.getItem(`creator-${token}`);
      if (storedCreator) {
        try {
          const { name: cName, phone: cPhone } = JSON.parse(storedCreator);
          setName(cName || "");
          setPhone(cPhone || "");
        } catch {}
      }
    }
  }, [token]);

  const handleNamePhoneNext = () => {
    setNamePhoneError("");
    if (!name.trim()) {
      setNamePhoneError("이름을 입력해주세요.");
      return;
    }
    const normalized = phone.replace(/[-\s]/g, "");
    if (!normalized) {
      setNamePhoneError("전화번호를 입력해주세요.");
      return;
    }
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
          body: JSON.stringify({
            name: name.trim(),
            phone: normalizedPhone,
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

      if (!res.ok) {
        setSubmitError(data.error || "오류가 발생했습니다.");
        return;
      }

      if (data.editToken) {
        localStorage.setItem(`editToken-${token}`, data.editToken);
        setEditToken(data.editToken);
      }

      // Save to responded history
      if (!isEditing) {
        try {
          const stored = JSON.parse(localStorage.getItem("my-responded-meetings") || "[]");
          const alreadyExists = stored.some((m: { token: string }) => m.token === token);
          if (!alreadyExists && meeting) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "약속을 찾을 수 없습니다."}</p>
          <Link href="/" className="text-indigo-600 hover:underline">홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const dates = getDateRange(meeting.startDate, meeting.endDate);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-bold text-indigo-700">시간 조율</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditing ? "응답이 수정되었습니다!" : "응답이 제출되었습니다!"}
            </h1>
            <p className="text-gray-600 mb-6">
              <strong>{meeting.title}</strong> 약속에 응답해 주셨습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/meetings/${meeting.id}/manage`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-center"
              >
                응답 현황 보기
              </Link>
              {editToken && (
                <button
                  onClick={handleEditResponse}
                  className="border border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  응답 수정하기
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Clock className="w-5 h-5 text-indigo-600" />
          <span className="text-lg font-bold text-indigo-700">시간 조율</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Meeting Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{meeting.title}</h1>
          {meeting.description && (
            <p className="text-gray-600 text-sm mb-3">{meeting.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">약속 기간</p>
              <p className="font-medium text-gray-800">
                {formatDateShort(meeting.startDate)} ~ {formatDateShort(meeting.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">응답 마감</p>
              <p className="font-medium text-gray-800">{formatDate(meeting.deadline)}</p>
            </div>
          </div>

          {meeting.isConfirmed && meeting.confirmedDate && meeting.confirmedSlot && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">약속이 확정되었습니다</span>
              </div>
              <p className="text-green-800 mt-1 text-sm">
                {formatDateShort(meeting.confirmedDate)} · {formatHour(parseInt(meeting.confirmedSlot))}
              </p>
            </div>
          )}
        </div>

        {meeting.isConfirmed ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-600">약속 일정이 확정되어 응답을 받지 않습니다.</p>
          </div>
        ) : isEditing ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">불가능한 시간 선택</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              참석이 불가능한 시간을 탭하거나 드래그하여 선택하세요. 선택하지 않은 시간은 참석 가능으로 처리됩니다.
            </p>
            <HourlyDragGrid
              dates={dates}
              unavailableSlots={unavailableSlots}
              setUnavailableSlots={setUnavailableSlots}
            />
            {submitError && <p className="text-red-600 text-sm mt-3">{submitError}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitLoading ? "저장 중..." : "응답 수정 완료"}
            </button>
          </div>
        ) : step === 1 ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-100 rounded-full p-1.5">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">참가자 정보</h2>
            </div>

            {namePhoneError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {namePhoneError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                  placeholder="이름을 입력하세요"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNamePhoneNext()}
                  placeholder="01012345678"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">하이픈(-) 없이 숫자만 입력해주세요</p>
              </div>
            </div>

            <button
              onClick={handleNamePhoneNext}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              다음
            </button>

            {editToken && !isEditing && (
              <button
                onClick={handleEditResponse}
                className="w-full mt-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                이전 응답 수정하기
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">불가능한 시간 선택</h2>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                이름/번호 수정
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <strong>{name}</strong>님, 참석 불가능한 시간을 탭하거나 드래그하여 선택하세요.
              <br />
              <span className="text-gray-400">선택하지 않은 시간 = 참석 가능</span>
            </p>

            <HourlyDragGrid
              dates={dates}
              unavailableSlots={unavailableSlots}
              setUnavailableSlots={setUnavailableSlots}
            />

            {submitError && <p className="text-red-600 text-sm mt-3">{submitError}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitLoading ? "제출 중..." : "응답 제출"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

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
    const target = e.target as HTMLElement;
    const cell = target.closest("[data-slot-key]") as HTMLElement | null;
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

  const handlePointerUp = () => {
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

  const countForDate = (date: string) =>
    HOURS.filter((h) => isUnavailable(date, h)).length;

  return (
    <div>
      {/* Date tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-6 px-6">
        {dates.map((date) => {
          const d = new Date(date + "T00:00:00");
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const count = countForDate(date);
          const isActive = date === activeDate;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setActiveDate(date)}
              className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-colors min-w-[60px] ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className={`text-xs font-medium ${
                isActive ? "text-indigo-200" : isWeekend ? "text-red-400" : "text-gray-500"
              }`}>
                {WEEKDAY_NAMES[d.getDay()]}
              </span>
              <span className="text-sm font-bold">{d.getMonth() + 1}/{d.getDate()}</span>
              <span className={`text-xs mt-0.5 ${
                count > 0 ? (isActive ? "text-red-200" : "text-red-500") : "text-transparent"
              }`}>
                {count > 0 ? `${count}개 불가` : "·"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          탭하거나 드래그해서 불가 시간 선택
        </p>
        <button
          type="button"
          onClick={() => toggleAllDay(activeDate)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {HOURS.every((h) => isUnavailable(activeDate, h)) ? "전체 해제" : "하루 전체 선택"}
        </button>
      </div>

      {/* Hour grid — drag-enabled container */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        {TIME_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {group.hours.map((hour) => {
                const unavail = isUnavailable(activeDate, hour);
                const key = slotKey(activeDate, hour);
                return (
                  <div
                    key={hour}
                    data-slot-key={key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl select-none cursor-pointer ${
                      unavail
                        ? "bg-red-50 border-2 border-red-300 text-red-700"
                        : "bg-gray-50 border-2 border-transparent text-gray-700"
                    }`}
                  >
                    <span className="text-sm font-medium pointer-events-none">{hour}:00</span>
                    <span className={`text-xs font-medium pointer-events-none ${unavail ? "text-red-500" : "text-gray-300"}`}>
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
