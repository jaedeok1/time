"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ExternalLink } from "lucide-react";

interface CreatedMeeting {
  id: string;
  title: string;
  createdAt: string;
}

interface RespondedMeeting {
  token: string;
  meetingId: string;
  title: string;
  respondedAt: string;
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function MyPage() {
  const [created, setCreated] = useState<CreatedMeeting[]>([]);
  const [responded, setResponded] = useState<RespondedMeeting[]>([]);

  useEffect(() => {
    try {
      setCreated(JSON.parse(localStorage.getItem("my-created-meetings") || "[]"));
      setResponded(JSON.parse(localStorage.getItem("my-responded-meetings") || "[]"));
    } catch {}
  }, []);

  const removeCreated = (id: string) => {
    const next = created.filter((m) => m.id !== id);
    setCreated(next);
    localStorage.setItem("my-created-meetings", JSON.stringify(next));
  };

  const removeResponded = (token: string) => {
    const next = responded.filter((m) => m.token !== token);
    setResponded(next);
    localStorage.setItem("my-responded-meetings", JSON.stringify(next));
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
        <div className="mb-12">
          <p className="font-mono text-xs tracking-widest uppercase text-dim mb-3">History</p>
          <h1 className="font-serif text-4xl font-bold tracking-tight">내 약속</h1>
          <div className="h-[3px] bg-black mt-4" />
        </div>

        {/* Created meetings */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-6">
            <p className="font-mono text-xs tracking-widest uppercase text-dim">
              01 — 내가 만든 약속
            </p>
            <span className="font-mono text-xs text-dim tabular-nums">{created.length}개</span>
          </div>

          {created.length === 0 ? (
            <div className="border border-black p-10 text-center">
              <p className="font-mono text-sm text-dim mb-6">만든 약속이 없습니다.</p>
              <Link
                href="/meetings/new"
                className="font-mono text-xs tracking-widest uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity duration-100"
              >
                새 약속 만들기 →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5] border-y border-black">
              {created.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-4 group hover:bg-muted transition-colors duration-100 px-4 -mx-4"
                >
                  <Link href={`/meetings/${m.id}/manage`} className="flex-1 min-w-0">
                    <p className="font-serif font-bold truncate">{m.title}</p>
                    <p className="font-mono text-xs text-dim mt-0.5">
                      {formatRelative(m.createdAt)} 생성
                    </p>
                  </Link>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <Link
                      href={`/meetings/${m.id}/manage`}
                      className="font-mono text-xs tracking-widest uppercase border-b border-transparent hover:border-black transition-all duration-100 pb-0.5 flex items-center gap-1"
                    >
                      관리 <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    </Link>
                    <button
                      onClick={() => removeCreated(m.id)}
                      className="text-[#e5e5e5] hover:text-black transition-colors duration-100 opacity-0 group-hover:opacity-100"
                      title="목록에서 제거"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="h-[3px] bg-black mb-12" />

        {/* Responded meetings */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <p className="font-mono text-xs tracking-widest uppercase text-dim">
              02 — 내가 응답한 약속
            </p>
            <span className="font-mono text-xs text-dim tabular-nums">{responded.length}개</span>
          </div>

          {responded.length === 0 ? (
            <div className="border border-black p-10 text-center">
              <p className="font-mono text-sm text-dim">응답한 약속이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e5e5] border-y border-black">
              {responded.map((m) => (
                <div
                  key={m.token}
                  className="flex items-center justify-between py-4 group hover:bg-muted transition-colors duration-100 px-4 -mx-4"
                >
                  <Link href={`/meetings/${m.meetingId}/manage`} className="flex-1 min-w-0">
                    <p className="font-serif font-bold truncate">{m.title}</p>
                    <p className="font-mono text-xs text-dim mt-0.5">
                      {formatRelative(m.respondedAt)} 응답
                    </p>
                  </Link>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <Link
                      href={`/meetings/${m.meetingId}/manage`}
                      className="font-mono text-xs tracking-widest uppercase border-b border-transparent hover:border-black transition-all duration-100 pb-0.5 flex items-center gap-1"
                    >
                      결과 <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    </Link>
                    <Link
                      href={`/invite/${m.token}`}
                      className="font-mono text-xs tracking-widest uppercase border-b border-transparent hover:border-black transition-all duration-100 pb-0.5"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => removeResponded(m.token)}
                      className="text-[#e5e5e5] hover:text-black transition-colors duration-100 opacity-0 group-hover:opacity-100"
                      title="목록에서 제거"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="font-mono text-xs text-dim text-center mt-12">
          이 목록은 이 기기의 브라우저에만 저장됩니다.
        </p>
      </main>
    </div>
  );
}
