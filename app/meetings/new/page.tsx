"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatShort(ymd: string): string {
  return new Date(ymd + "T00:00:00").toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  minDate,
}: {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  minDate: string;
}) {
  const initDate = new Date(minDate + "T00:00:00");
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [phase, setPhase] = useState<"start" | "end">("start");
  const [hoverDate, setHoverDate] = useState("");

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleClick = (ymd: string) => {
    if (ymd < minDate) return;
    if (phase === "start") {
      onRangeChange(ymd, "");
      setPhase("end");
    } else {
      if (!startDate || ymd < startDate) {
        onRangeChange(ymd, "");
        setPhase("end");
      } else {
        onRangeChange(startDate, ymd);
        setPhase("start");
      }
    }
  };

  const previewEnd =
    phase === "end" && hoverDate && startDate && hoverDate >= startDate
      ? hoverDate
      : endDate;

  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {viewYear}년 {MONTHS[viewMonth]}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="h-9" />;

            const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = ymd < minDate;
            const isStart = ymd === startDate;
            const isEnd = ymd === endDate;
            const isPreviewEnd = phase === "end" && ymd === previewEnd && !isEnd;
            const inRange = !!(startDate && previewEnd && ymd > startDate && ymd < previewEnd);
            const dow = idx % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;

            let spanClass = "";
            if (isStart || isEnd) {
              spanClass = "bg-indigo-600 text-white";
            } else if (isPreviewEnd) {
              spanClass = "bg-indigo-300 text-white";
            } else if (inRange) {
              spanClass = "bg-indigo-100 text-indigo-700";
            } else if (!isPast) {
              spanClass = `hover:bg-gray-100 ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-700"}`;
            }

            return (
              <div
                key={ymd}
                className={`h-9 flex items-center justify-center ${isPast ? "cursor-default" : "cursor-pointer"}`}
                onClick={() => !isPast && handleClick(ymd)}
                onMouseEnter={() => !isPast && setHoverDate(ymd)}
                onMouseLeave={() => setHoverDate("")}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium select-none transition-colors ${
                    isPast ? "text-gray-300" : ""
                  } ${spanClass}`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs min-h-[36px] flex items-center justify-between">
        {!startDate ? (
          <span className="text-indigo-600 font-medium">시작일을 선택하세요</span>
        ) : !endDate ? (
          <span className="text-indigo-600 font-medium">종료일을 선택하세요</span>
        ) : (
          <>
            <span className="text-gray-700 font-medium">
              {formatShort(startDate)} ~ {formatShort(endDate)}
            </span>
            <button
              type="button"
              onClick={() => { onRangeChange("", ""); setPhase("start"); }}
              className="text-gray-400 hover:text-gray-600 underline ml-2"
            >
              초기화
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function NewMeetingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = getToday();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    deadline: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRangeChange = (start: string, end: string) => {
    setFormData(prev => {
      const next = { ...prev, startDate: start, endDate: end };
      if (start) {
        const d = new Date(start + "T00:00:00");
        d.setDate(d.getDate() - 1);
        const ymd = toYMD(d);
        next.deadline = ymd < today ? today : ymd;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!formData.phone.trim()) { setError("전화번호를 입력해주세요."); return; }
    if (!formData.title.trim()) { setError("모임 이름을 입력해주세요."); return; }
    if (!formData.startDate || !formData.endDate) { setError("모임 기간을 선택해주세요."); return; }
    if (!formData.deadline) { setError("응답 마감일을 설정해주세요."); return; }
    if (formData.deadline < today) { setError("응답 마감일은 오늘 이후여야 합니다."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          title: formData.title,
          description: formData.description || null,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          deadline: new Date(formData.deadline).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError((data.error || "오류가 발생했습니다.") + (data.detail ? ` [${data.detail}]` : ""));
        return;
      }

      try {
        // Store creator's editToken so they can fill their availability via invite link
        if (data.editToken && data.token) {
          localStorage.setItem(`editToken-${data.token}`, data.editToken);
        }
        const stored = JSON.parse(localStorage.getItem("my-created-meetings") || "[]");
        stored.unshift({ id: data.id, title: formData.title.trim(), createdAt: new Date().toISOString() });
        localStorage.setItem("my-created-meetings", JSON.stringify(stored.slice(0, 50)));
      } catch {}

      router.push(`/meetings/${data.id}/manage`);
    } catch {
      setError("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Clock className="w-5 h-5 text-indigo-600" />
          <span className="text-lg font-bold text-indigo-700">시간 조율</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 rounded-full p-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">새 모임 시작하기</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organizer info */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">주최자 정보</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Meeting title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모임 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 팀 회식, 스터디 모임"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모임 설명 <span className="text-gray-400">(선택)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="모임에 대한 간단한 설명을 입력하세요"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Date range picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모임 기간 <span className="text-red-500">*</span>
              </label>
              <DateRangePicker
                startDate={formData.startDate}
                endDate={formData.endDate}
                onRangeChange={handleRangeChange}
                minDate={today}
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                응답 마감일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={today}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                이 날짜까지 참가자들이 응답할 수 있습니다.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? "생성 중..." : "모임 시작하기"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
