import Link from "next/link";
import { Header } from "@/components/header";
import { buttonVariants } from "@/lib/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header>
        <Link href="/my" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4 text-sm")}>
          내 약속
        </Link>
        <Link href="/meetings/new" className={cn(buttonVariants(), "h-9 px-4 text-sm")}>
          약속 잡기
        </Link>
      </Header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
          style={{
            background: "rgba(68,220,234,0.08)",
            border: "1px solid rgba(68,220,234,0.2)",
            color: "oklch(0.83 0.11 196)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          무료 · 회원가입 불필요
        </div>

        <h1 className="font-display mb-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          약속 시간,{" "}
          <span className="text-primary">쉽게</span> 맞추세요
        </h1>

        <p className="mx-auto mb-10 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
          참가자들이 불가능한 시간을 표시하면,
          가장 많은 사람이 참석 가능한 시간을 자동으로 찾아드립니다.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/meetings/new"
            className={cn(buttonVariants(), "h-11 px-7 text-sm font-semibold")}
          >
            약속 잡기
          </Link>
          <Link
            href="/my"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 px-7 text-sm")}
          >
            내 약속 보기
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="mb-10 text-center">
          <p className="font-display mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            3단계로 끝납니다
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              num: "01",
              title: "약속 잡기",
              desc: "약속 이름과 날짜 범위를 설정하고 약속을 만듭니다.",
            },
            {
              num: "02",
              title: "참가자 응답",
              desc: "초대 링크를 공유하면 참가자들이 불가능한 시간대를 선택합니다.",
            },
            {
              num: "03",
              title: "최적 시간 확정",
              desc: "가장 많은 사람이 참석 가능한 시간을 계산해 보여줍니다.",
            },
          ].map((step) => (
            <Card key={step.num} className="p-6 transition-transform duration-200 hover:-translate-y-0.5">
              <CardContent className="p-0">
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(68,220,234,0.1)",
                    border: "1px solid rgba(68,220,234,0.2)",
                  }}
                >
                  <span className="font-display text-sm font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="font-display mb-2 text-base font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto max-w-5xl border-t border-border/40 px-4 py-6 flex items-center justify-between">
        <span className="font-display text-sm font-bold text-foreground/40">시간조율</span>
        <p className="text-xs text-muted-foreground">© 2026</p>
      </footer>
    </div>
  );
}
