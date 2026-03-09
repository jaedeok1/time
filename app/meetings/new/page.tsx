"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="border border-black">
      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-black hover:text-white transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-sm tracking-widest">
          {viewYear}.{String(viewMonth + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-black hover:text-white transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center font-mono text-xs py-1 tracking-widest ${
                i === 0 ? "text-dim" : i === 6 ? "text-dim" : "text-dim"
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

            let cellClass = "";
            if (isStart || isEnd) {
              cellClass = "bg-black text-white";
            } else if (isPreviewEnd) {
              cellClass = "bg-black/30 text-black";
            } else if (inRange) {
              cellClass = "bg-black/10 text-black";
            } else if (!isPast) {
              cellClass = "hover:bg-black/10";
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
                  className={`w-8 h-8 flex items-center justify-center font-mono text-sm select-none transition-colors duration-100 ${
                    isPast ? "text-black/20" : ""
                  } ${cellClass}`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2.5 border-t border-black text-xs font-mono min-h-[36px] flex items-center justify-between">
        {!startDate ? (
          <span className="tracking-wide">시작일을 선택하세요</span>
        ) : !endDate ? (
          <span className="tracking-wide">종료일을 선택하세요</span>
        ) : (
          <>
            <span>
              {formatShort(startDate)} — {formatShort(endDate)}
            </span>
            <button
              type="button"
              onClick={() => { onRangeChange("", ""); setPhase("start"); }}
              className="underline hover:no-underline ml-2 text-dim"
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

      if (!res.ok) {
        setError((data.error || "오류가 발생했습니다.") + (data.detail ? ` [${data.detail}]` : ""));
        return;
      }

      try {
        if (data.token) {
          localStorage.setItem(`creator-${data.token}`, JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
          }));
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
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Page title */}
        <div className="mb-10">
          <p className="font-mono text-xs tracking-widest uppercase text-dim mb-3">
            New Event
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            새 약속 잡기
          </h1>
          <div className="h-[3px] bg-black mt-4" />
        </div>

        {/* Error */}
        {error && (
          <div className="border-l-4 border-black bg-muted px-5 py-3 mb-8">
            <p className="text-sm font-mono">⚠ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section: 주최자 */}
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-6">
              01 — 주최자 정보
            </p>
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-xs tracking-widest uppercase mb-3">
                  이름 <span className="text-dim">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base placeholder:text-dim/50 focus:outline-none focus:border-b-4 transition-all duration-100"
                />
              </div>
              <div>
                <label className="block font-mono text-xs tracking-widest uppercase mb-3">
                  전화번호 <span className="text-dim">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base placeholder:text-dim/50 focus:outline-none focus:border-b-4 transition-all duration-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-subtle" />

          {/* Section: 약속 정보 */}
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-6">
              02 — 약속 정보
            </p>
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-xs tracking-widest uppercase mb-3">
                  약속 이름 <span className="text-dim">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="예: 팀 회식, 스터디, 동창 모임"
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base placeholder:text-dim/50 focus:outline-none focus:border-b-4 transition-all duration-100"
                />
              </div>
              <div>
                <label className="block font-mono text-xs tracking-widest uppercase mb-3">
                  약속 설명 <span className="text-dim">(선택)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="모임에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="w-full border-b-2 border-black bg-transparent py-3 text-base placeholder:text-dim/50 focus:outline-none focus:border-b-4 transition-all duration-100 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-subtle" />

          {/* Section: 기간 */}
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-6">
              03 — 약속 기간 <span className="text-black">*</span>
            </p>
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onRangeChange={handleRangeChange}
              minDate={today}
            />
          </div>

          <div className="h-px bg-subtle" />

          {/* Section: 마감일 */}
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-dim mb-6">
              04 — 응답 마감일 <span className="text-black">*</span>
            </p>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={today}
              className="w-full border-b-2 border-black bg-transparent py-3 text-base focus:outline-none focus:border-b-4 transition-all duration-100 font-mono"
            />
            <p className="font-mono text-xs text-dim mt-3 tracking-wide">
              이 날짜까지 참가자들이 응답할 수 있습니다.
            </p>
          </div>

          <div className="h-[3px] bg-black" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-sm font-bold tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
          >
            {loading ? "생성 중..." : "약속 잡기 →"}
          </button>
        </form>
      </main>
    </div>
  );
}
