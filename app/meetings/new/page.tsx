"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Header } from "@/components/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
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
    phase === "end" && hoverDate && startDate && hoverDate >= startDate ? hoverDate : endDate;

  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Month nav */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          onClick={prevMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-semibold text-foreground">
          {viewYear}년 {MONTHS[viewMonth]}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={nextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-center text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="h-9" />;

            const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = ymd < minDate;
            const isStart = ymd === startDate;
            const isEnd = ymd === endDate;
            const isPreviewEnd = phase === "end" && ymd === previewEnd && !isEnd;
            const inRange = !!(startDate && previewEnd && ymd > startDate && ymd < previewEnd);

            let spanClass = "";
            let spanStyle: React.CSSProperties = {};

            if (isStart || isEnd) {
              spanClass = "font-bold text-primary-foreground";
              spanStyle = {
                background: "oklch(0.83 0.11 196)",
                boxShadow: "0 0 12px rgba(68,220,234,0.35)",
              };
            } else if (isPreviewEnd) {
              spanClass = "text-primary font-semibold";
              spanStyle = {
                background: "rgba(68,220,234,0.15)",
                border: "1px solid rgba(68,220,234,0.3)",
              };
            } else if (inRange) {
              spanClass = "text-primary/70";
              spanStyle = { background: "rgba(68,220,234,0.07)" };
            } else if (!isPast) {
              spanClass = "text-foreground hover:text-primary hover:bg-muted";
            }

            return (
              <div
                key={ymd}
                className={`flex h-9 items-center justify-center ${isPast ? "cursor-default" : "cursor-pointer"}`}
                onClick={() => !isPast && handleClick(ymd)}
                onMouseEnter={() => !isPast && setHoverDate(ymd)}
                onMouseLeave={() => setHoverDate("")}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm select-none transition-all duration-150",
                    isPast ? "text-muted-foreground/25" : "",
                    spanClass
                  )}
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
      <div className="border-t border-border px-4 py-3">
        <div className="flex min-h-[36px] items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
          {!startDate ? (
            <span className="text-muted-foreground">시작일을 선택하세요</span>
          ) : !endDate ? (
            <span className="font-medium text-primary">종료일을 선택하세요</span>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {formatShort(startDate)} — {formatShort(endDate)}
              </span>
              <button
                type="button"
                onClick={() => { onRangeChange("", ""); setPhase("start"); }}
                className="ml-2 text-xs text-muted-foreground underline transition-colors hover:text-foreground"
              >
                초기화
              </button>
            </>
          )}
        </div>
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRangeChange = (start: string, end: string) => {
    setFormData((prev) => {
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
        if (data.token)
          localStorage.setItem(
            `creator-${data.token}`,
            JSON.stringify({ name: formData.name.trim(), phone: formData.phone.trim() })
          );
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
    <div className="min-h-screen bg-background">
      <Header maxWidth="lg">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4 text-sm")}>
          ← 홈
        </Link>
      </Header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            새 약속 잡기
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">정보를 입력하고 약속을 만들어보세요</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 01 주최자 */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary"
                  style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}
                >
                  01
                </span>
                <CardTitle className="text-sm font-bold text-foreground">주최자 정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  이름 <span className="text-primary">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  전화번호 <span className="text-primary">*</span>
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* 02 약속 정보 */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary"
                  style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}
                >
                  02
                </span>
                <CardTitle className="text-sm font-bold text-foreground">약속 정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  약속 이름 <span className="text-primary">*</span>
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="예: 팀 회식, 스터디, 동창 모임"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  약속 설명{" "}
                  <span className="font-normal text-muted-foreground">(선택)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="모임에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-white/5 px-3 py-2.5 text-[16px] text-white/90 placeholder:text-white/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
            </CardContent>
          </Card>

          {/* 03 기간 */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary"
                  style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}
                >
                  03
                </span>
                <CardTitle className="text-sm font-bold text-foreground">
                  약속 기간 <span className="text-primary">*</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <DateRangePicker
                startDate={formData.startDate}
                endDate={formData.endDate}
                onRangeChange={handleRangeChange}
                minDate={today}
              />
            </CardContent>
          </Card>

          {/* 04 마감일 */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary"
                  style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}
                >
                  04
                </span>
                <CardTitle className="text-sm font-bold text-foreground">
                  응답 마감일 <span className="text-primary">*</span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={today}
                className="h-11"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                이 날짜까지 참가자들이 응답할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold">
            {loading ? "생성 중..." : "약속 잡기 →"}
          </Button>
        </form>
      </main>
    </div>
  );
}
