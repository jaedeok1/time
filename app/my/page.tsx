"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ExternalLink, Calendar, MessageSquare, Plus } from "lucide-react";

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
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-base/80 backdrop-blur-sm py-4 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="neu-card flex items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="font-display font-bold text-xl text-fore tracking-tight"
            >
              시간조율
            </Link>
            <Link
              href="/meetings/new"
              className="neu-btn neu-btn-primary px-5 py-2.5 text-sm"
            >
              <Plus size={14} strokeWidth={2.5} />
              약속 잡기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-10">
          <p className="font-display text-sm font-semibold text-accent tracking-widest uppercase mb-3">
            History
          </p>
          <h1 className="font-display text-4xl font-extrabold text-fore tracking-tight">
            내 약속
          </h1>
          <p className="text-muted mt-2 text-sm">
            이 기기의 브라우저에만 저장됩니다.
          </p>
        </div>

        {/* Created meetings */}
        <section className="mb-8">
          <div className="neu-card p-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-base neu-deep flex items-center justify-center">
                  <Calendar size={16} strokeWidth={1.5} className="text-accent" />
                </div>
                <div>
                  <p className="font-display text-xs font-semibold text-accent tracking-widest uppercase">
                    01
                  </p>
                  <h2 className="font-display text-lg font-bold text-fore">
                    내가 만든 약속
                  </h2>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-base neu-inset-sm flex items-center justify-center">
                <span className="font-display text-sm font-bold text-muted tabular-nums">
                  {created.length}
                </span>
              </div>
            </div>

            {created.length === 0 ? (
              <div className="neu-deep rounded-2xl p-8 text-center">
                <p className="text-muted text-sm mb-5">만든 약속이 없습니다.</p>
                <Link
                  href="/meetings/new"
                  className="neu-btn neu-btn-primary px-6 py-2.5 text-sm"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  새 약속 만들기
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {created.map((m) => (
                  <div
                    key={m.id}
                    className="neu-inset-sm rounded-2xl p-4 flex items-center justify-between group"
                  >
                    <Link href={`/meetings/${m.id}/manage`} className="flex-1 min-w-0">
                      <p className="font-display font-bold text-fore truncate">{m.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatRelative(m.createdAt)} 생성
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Link
                        href={`/meetings/${m.id}/manage`}
                        className="neu-btn neu-btn-secondary px-3 py-2 text-xs flex items-center gap-1"
                      >
                        관리
                        <ExternalLink size={11} strokeWidth={2} />
                      </Link>
                      <button
                        onClick={() => removeCreated(m.id)}
                        className="w-9 h-9 rounded-xl bg-base neu-raised-sm flex items-center justify-center text-muted hover:text-red-400 transition-colors duration-200"
                        title="목록에서 제거"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Responded meetings */}
        <section>
          <div className="neu-card p-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-base neu-deep flex items-center justify-center">
                  <MessageSquare size={16} strokeWidth={1.5} className="text-accent" />
                </div>
                <div>
                  <p className="font-display text-xs font-semibold text-accent tracking-widest uppercase">
                    02
                  </p>
                  <h2 className="font-display text-lg font-bold text-fore">
                    내가 응답한 약속
                  </h2>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-base neu-inset-sm flex items-center justify-center">
                <span className="font-display text-sm font-bold text-muted tabular-nums">
                  {responded.length}
                </span>
              </div>
            </div>

            {responded.length === 0 ? (
              <div className="neu-deep rounded-2xl p-8 text-center">
                <p className="text-muted text-sm">응답한 약속이 없습니다.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {responded.map((m) => (
                  <div
                    key={m.token}
                    className="neu-inset-sm rounded-2xl p-4 flex items-center justify-between group"
                  >
                    <Link href={`/meetings/${m.meetingId}/manage`} className="flex-1 min-w-0">
                      <p className="font-display font-bold text-fore truncate">{m.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatRelative(m.respondedAt)} 응답
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Link
                        href={`/meetings/${m.meetingId}/manage`}
                        className="neu-btn neu-btn-secondary px-3 py-2 text-xs flex items-center gap-1"
                      >
                        결과
                        <ExternalLink size={11} strokeWidth={2} />
                      </Link>
                      <Link
                        href={`/invite/${m.token}`}
                        className="neu-btn neu-btn-secondary px-3 py-2 text-xs"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => removeResponded(m.token)}
                        className="w-9 h-9 rounded-xl bg-base neu-raised-sm flex items-center justify-center text-muted hover:text-red-400 transition-colors duration-200"
                        title="목록에서 제거"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
