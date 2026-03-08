"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Calendar, Users, ArrowLeft, Trash2, ExternalLink } from "lucide-react";

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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">내 모임</h1>

        {/* Created meetings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">내가 만든 모임</h2>
            <span className="text-xs text-gray-400 ml-auto">{created.length}개</span>
          </div>

          {created.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">만든 모임이 없습니다.</p>
              <Link
                href="/meetings/new"
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                새 모임 만들기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {created.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                >
                  <Link
                    href={`/meetings/${m.id}/manage`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(m.createdAt)} 생성</p>
                  </Link>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <Link
                      href={`/meetings/${m.id}/manage`}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline"
                    >
                      관리 <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => removeCreated(m.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="목록에서 제거"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Responded meetings */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">내가 응답한 모임</h2>
            <span className="text-xs text-gray-400 ml-auto">{responded.length}개</span>
          </div>

          {responded.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">응답한 모임이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {responded.map((m) => (
                <div
                  key={m.token}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                >
                  <Link
                    href={`/meetings/${m.meetingId}/manage`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(m.respondedAt)} 응답</p>
                  </Link>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <Link
                      href={`/meetings/${m.meetingId}/manage`}
                      className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                    >
                      결과 보기 <ExternalLink className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/invite/${m.token}`}
                      className="flex items-center gap-1 text-xs text-gray-500 font-medium hover:underline"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => removeResponded(m.token)}
                      className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="목록에서 제거"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          이 목록은 이 기기의 브라우저에만 저장됩니다.
        </p>
      </main>
    </div>
  );
}
