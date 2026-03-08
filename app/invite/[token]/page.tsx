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
        setError(data.error || "모임을 찾을 수 없습니다.");
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

  useEffect(() => {
    if (token) {
      const stored = localStorage.getItem(`editToken-${token}`);
      if (stored) {
        setEditToken(stored);
        setIsEditing(true);
        setStep(2);
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
          <p className="text-red-600 mb-4">{error || "모임을 찾을 수 없습니다."}</p>
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
              <strong>{meeting.title}</strong> 모임에 응답해 주셨습니다.
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
              <p className="text-xs text-gray-500 mb-0.5">모임 기간</p>
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
                <span className="font-semibold">모임이 확정되었습니다</span>
              </div>
              <p className="text-green-800 mt-1 text-sm">
                {formatDateShort(meeting.confirmedDate)} · {formatHour(parseInt(meeting.confirmedSlot))}
              </p>
            </div>
          )}
        </div>

        {meeting.isConfirmed ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-600">모임 일정이 확정되어 응답을 받지 않습니다.</p>
          </div>
        ) : isEditing ? (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">불가능한 시간 선택</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              참석이 불가능한 시간을 드래그하여 선택해주세요. 선택하지 않은 시간은 참석 가능으로 처리됩니다.
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
              <strong>{name}</strong>님, 참석 불가능한 시간을 드래그하여 선택해주세요.
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

function HourlyDragGrid({
  dates,
  unavailableSlots,
  setUnavailableSlots,
}: {
  dates: string[];
  unavailableSlots: Set<string>;
  setUnavailableSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const isDragging = useRef(false);
  const dragMode = useRef<"add" | "remove">("add");

  const isUnavailable = (date: string, hour: number) =>
    unavailableSlots.has(slotKey(date, hour));

  const applyCell = useCallback(
    (date: string, hour: number, mode: "add" | "remove") => {
      const key = slotKey(date, hour);
      setUnavailableSlots((prev) => {
        const next = new Set(prev);
        if (mode === "add") next.add(key);
        else next.delete(key);
        return next;
      });
    },
    [setUnavailableSlots]
  );

  const handleMouseDown = (date: string, hour: number) => {
    const currently = isUnavailable(date, hour);
    dragMode.current = currently ? "remove" : "add";
    isDragging.current = true;
    applyCell(date, hour, dragMode.current);
  };

  const handleMouseEnter = (date: string, hour: number) => {
    if (!isDragging.current) return;
    applyCell(date, hour, dragMode.current);
  };

  useEffect(() => {
    const onUp = () => { isDragging.current = false; };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  const handleTouchStart = (e: React.TouchEvent, date: string, hour: number) => {
    e.preventDefault();
    const currently = isUnavailable(date, hour);
    dragMode.current = currently ? "remove" : "add";
    isDragging.current = true;
    applyCell(date, hour, dragMode.current);
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return;
      const cell = el.closest("[data-date][data-hour]") as HTMLElement | null;
      if (!cell) return;
      applyCell(cell.dataset.date!, parseInt(cell.dataset.hour!), dragMode.current);
    },
    [applyCell]
  );

  useEffect(() => {
    const onEnd = () => { isDragging.current = false; };
    document.addEventListener("touchend", onEnd);
    return () => document.removeEventListener("touchend", onEnd);
  }, []);

  // Hour tick labels shown at 0, 6, 12, 18
  const TICK_HOURS = new Set([0, 6, 12, 18]);

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 border border-gray-200 bg-white rounded-sm" />
          참석 가능
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 border border-red-300 bg-red-400 rounded-sm" />
          참석 불가
        </span>
        <span className="text-gray-400">· 드래그하여 범위 선택</span>
      </div>

      <div className="select-none">
        {/* Hour tick header */}
        <div className="flex mb-0.5">
          <div className="w-16 shrink-0" />
          <div className="flex-1 flex relative h-4">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 relative">
                {TICK_HOURS.has(h) && (
                  <span className="absolute left-0 text-xs text-gray-400 -translate-x-1/2">
                    {h}시
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Date rows */}
        <div onTouchMove={handleTouchMove}>
          {dates.map((date) => {
            const d = new Date(date + "T00:00:00");
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const allSelected = HOURS.every((h) => isUnavailable(date, h));

            const toggleAllDay = () => {
              const mode = allSelected ? "remove" : "add";
              setUnavailableSlots((prev) => {
                const next = new Set(prev);
                HOURS.forEach((h) => {
                  const key = slotKey(date, h);
                  if (mode === "add") next.add(key);
                  else next.delete(key);
                });
                return next;
              });
            };

            return (
              <div key={date} className="flex items-center mb-1">
                {/* Date label — click to toggle all */}
                <button
                  type="button"
                  onClick={toggleAllDay}
                  title={allSelected ? "전체 해제" : "하루 전체 선택"}
                  className={`w-16 shrink-0 text-xs font-semibold pr-2 text-right leading-tight cursor-pointer rounded hover:opacity-70 transition-opacity ${
                    isWeekend ? "text-red-500" : "text-gray-600"
                  } ${allSelected ? "opacity-60" : ""}`}
                >
                  <div>{d.getMonth() + 1}/{d.getDate()}</div>
                  <div className={`font-normal ${allSelected ? "text-red-400" : "text-gray-400"}`}>
                    {WEEKDAY_NAMES[d.getDay()]}
                  </div>
                </button>

                {/* 24 hour boxes */}
                <div className="flex-1 flex gap-px">
                  {HOURS.map((hour) => {
                    const unavail = isUnavailable(date, hour);
                    // Add separator every 6 hours for readability
                    const hasSep = hour > 0 && hour % 6 === 0;
                    return (
                      <div
                        key={hour}
                        data-date={date}
                        data-hour={hour}
                        className={`flex-1 h-8 rounded-sm cursor-pointer transition-colors ${
                          hasSep ? "ml-0.5" : ""
                        } ${
                          unavail
                            ? "bg-red-400 hover:bg-red-500"
                            : "bg-gray-100 hover:bg-indigo-100"
                        }`}
                        onMouseDown={() => handleMouseDown(date, hour)}
                        onMouseEnter={() => handleMouseEnter(date, hour)}
                        onTouchStart={(e) => handleTouchStart(e, date, hour)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
