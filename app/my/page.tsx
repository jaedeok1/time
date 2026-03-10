"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ExternalLink, Calendar, MessageSquare, Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background">
      <Header maxWidth="lg">
        <Link href="/meetings/new" className={cn(buttonVariants(), "h-9 gap-1.5 px-4 text-sm")}>
          <Plus size={14} strokeWidth={2.5} />
          약속 잡기
        </Link>
      </Header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Page title */}
        <div className="mb-8">
          <p className="font-display mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            History
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            내 약속
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">이 기기의 브라우저에만 저장됩니다.</p>
        </div>

        <div className="space-y-4">
          {/* Created meetings */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(68,220,234,0.1)",
                      border: "1px solid rgba(68,220,234,0.2)",
                    }}
                  >
                    <Calendar size={15} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">내가 만든 약속</CardTitle>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                  {created.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {created.length === 0 ? (
                <div className="rounded-xl bg-muted/30 p-8 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">만든 약속이 없습니다.</p>
                  <Link href="/meetings/new" className={cn(buttonVariants(), "h-9 gap-1.5 px-4 text-sm")}>
                    <Plus size={14} strokeWidth={2.5} />
                    새 약속 만들기
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {created.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Link href={`/meetings/${m.id}/manage`} className="min-w-0 flex-1">
                        <p className="font-display truncate font-semibold text-foreground">
                          {m.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelative(m.createdAt)} 생성
                        </p>
                      </Link>
                      <div className="ml-3 flex shrink-0 items-center gap-1.5">
                        <Link
                          href={`/meetings/${m.id}/manage`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-8 gap-1 px-2.5 text-xs"
                          )}
                        >
                          관리
                          <ExternalLink size={11} strokeWidth={2} />
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => removeCreated(m.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="목록에서 제거"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responded meetings */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(68,220,234,0.1)",
                      border: "1px solid rgba(68,220,234,0.2)",
                    }}
                  >
                    <MessageSquare size={15} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">내가 응답한 약속</CardTitle>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
                  {responded.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {responded.length === 0 ? (
                <div className="rounded-xl bg-muted/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">응답한 약속이 없습니다.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {responded.map((m) => (
                    <div
                      key={m.token}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Link href={`/meetings/${m.meetingId}/manage`} className="min-w-0 flex-1">
                        <p className="font-display truncate font-semibold text-foreground">
                          {m.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelative(m.respondedAt)} 응답
                        </p>
                      </Link>
                      <div className="ml-3 flex shrink-0 items-center gap-1.5">
                        <Link
                          href={`/meetings/${m.meetingId}/manage`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-8 gap-1 px-2.5 text-xs"
                          )}
                        >
                          결과
                          <ExternalLink size={11} strokeWidth={2} />
                        </Link>
                        <Link
                          href={`/invite/${m.token}`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-8 px-2.5 text-xs"
                          )}
                        >
                          수정
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => removeResponded(m.token)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="목록에서 제거"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
