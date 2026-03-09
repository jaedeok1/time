"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from "lucide-react";

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
    <div className="bg-base neu-card overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base/40">
        <button
          type="button"
          onClick={prevMonth}
          className="w-9 h-9 rounded-xl bg-base neu-raised-sm flex items-center justify-center hover:-translate-y-0.5 transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft className="w-4 h-4 text-muted" />
        </button>
        <span className="font-display font-semibold text-fore">
          {viewYear}년 {MONTHS[viewMonth]}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-9 h-9 rounded-xl bg-base neu-raised-sm flex items-center justify-center hover:-translate-y-0.5 transition-transform duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronRight className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="p-5">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs font-semibold text-muted py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="h-10" />;

            const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = ymd < minDate;
            const isStart = ymd === startDate;
            const isEnd = ymd === endDate;
            const isPreviewEnd = phase === "end" && ymd === previewEnd && !isEnd;
            const inRange = !!(startDate && previewEnd && ymd > startDate && ymd < previewEnd);

            let dayClass = "";
            let spanStyle: React.CSSProperties = {};

            if (isStart || isEnd) {
              dayClass = "text-white font-bold";
              spanStyle = {
                background: "#6C63FF",
                boxShadow: "inset 3px 3px 6px rgba(0,0,0,0.15), inset -3px -3px 6px rgba(255,255,255,0.1)",
              };
            } else if (isPreviewEnd) {
              dayClass = "text-accent font-semibold";
              spanStyle = {
                background: "rgba(108,99,255,0.15)",
                boxShadow: "inset 2px 2px 4px rgb(163 177 198 / 0.4), inset -2px -2px 4px rgba(255,255,255,0.4)",
              };
            } else if (inRange) {
              dayClass = "text-accent";
              spanStyle = { background: "rgba(108,99,255,0.08)" };
            } else if (!isPast) {
              dayClass = "text-fore hover:text-accent";
            }

            return (
              <div
                key={ymd}
                className={`h-10 flex items-center justify-center ${isPast ? "cursor-default" : "cursor-pointer"}`}
                onClick={() => !isPast && handleClick(ymd)}
                onMouseEnter={() => !isPast && setHoverDate(ymd)}
                onMouseLeave={() => setHoverDate("")}
              >
                <span
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm select-none transition-all duration-200 ${
                    isPast ? "text-muted/30" : ""
                  } ${dayClass}`}
                  style={spanStyle}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-6 py-3 bg-base neu-inset-sm mx-4 mb-4 rounded-2xl text-sm flex items-center justify-between min-h-[44px]">
        {!startDate ? (
          <span className="text-muted">시작일을 선택하세요</span>
        ) : !endDate ? (
          <span className="text-accent font-medium">종료일을 선택하세요</span>
        ) : (
          <>
            <span className="text-fore font-medium">
              {formatShort(startDate)} — {formatShort(endDate)}
            </span>
            <button
              type="button"
              onClick={() => { onRangeChange("", ""); setPhase("start"); }}
              className="text-muted hover:text-fore text-xs underline ml-2 transition-colors"
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!formData.title.trim()) { setError("약속 이름을 입력해주세요."); return; }
    if (!formData.startDate || !formData.endDate) { setError("약속 기간을 선택해주세요."); return; }
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
      if (!res.ok) { setError((data.error || "오류가 발생했습니다.") + (data.detail ? ` [${data.detail}]` : "")); return; }
      try {
        if (data.token) localStorage.setItem(`creator-${data.token}`, JSON.stringify({ name: formData.name.trim(), phone: formData.phone.trim() }));
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
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-base/80 backdrop-blur-sm py-4 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="neu-card flex items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="font-display font-bold text-xl text-fore tracking-tight hover:text-accent transition-colors"
            >
              시간조율
            </Link>
            <Link href="/" className="neu-btn neu-btn-secondary px-4 py-2 text-sm">
              ← 홈
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-base neu-deep flex items-center justify-center mx-auto mb-5">
            <Calendar size={26} strokeWidth={1.5} className="text-accent" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-fore tracking-tight">
            새 약속 잡기
          </h1>
          <p className="text-muted mt-2">정보를 입력하고 약속을 만들어보세요</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-base neu-inset rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <AlertCircle size={18} className="text-accent shrink-0" />
            <p className="text-sm text-fore font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Card: 주최자 */}
          <div className="neu-card p-7 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-base neu-deep flex items-center justify-center">
                <span className="font-display text-xs font-bold text-accent">01</span>
              </div>
              <h2 className="font-display font-bold text-fore">주최자 정보</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-fore mb-2">
                  이름 <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-fore mb-2">
                  전화번호 <span className="text-accent">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  className="neu-input"
                />
              </div>
            </div>
          </div>

          {/* Card: 약속 정보 */}
          <div className="neu-card p-7 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-base neu-deep flex items-center justify-center">
                <span className="font-display text-xs font-bold text-accent">02</span>
              </div>
              <h2 className="font-display font-bold text-fore">약속 정보</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-fore mb-2">
                  약속 이름 <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="예: 팀 회식, 스터디, 동창 모임"
                  className="neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-fore mb-2">
                  약속 설명 <span className="text-muted font-normal">(선택)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="모임에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="neu-input resize-none"
                  style={{ height: "auto" }}
                />
              </div>
            </div>
          </div>

          {/* Card: 기간 */}
          <div className="neu-card p-7 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-base neu-deep flex items-center justify-center">
                <span className="font-display text-xs font-bold text-accent">03</span>
              </div>
              <h2 className="font-display font-bold text-fore">
                약속 기간 <span className="text-accent">*</span>
              </h2>
            </div>
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onRangeChange={handleRangeChange}
              minDate={today}
            />
          </div>

          {/* Card: 마감일 */}
          <div className="neu-card p-7 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-base neu-deep flex items-center justify-center">
                <span className="font-display text-xs font-bold text-accent">04</span>
              </div>
              <h2 className="font-display font-bold text-fore">
                응답 마감일 <span className="text-accent">*</span>
              </h2>
            </div>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={today}
              className="neu-input"
            />
            <p className="text-xs text-muted mt-3 ml-1">
              이 날짜까지 참가자들이 응답할 수 있습니다.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neu-btn neu-btn-primary w-full py-5 text-base"
          >
            {loading ? "생성 중..." : "약속 잡기 →"}
          </button>
        </form>
      </main>
    </div>
  );
}
