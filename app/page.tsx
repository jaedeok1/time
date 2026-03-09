import Link from "next/link";
import { Calendar, Users, CheckCircle, Zap, RefreshCw, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-base">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-base/80 backdrop-blur-sm py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="neu-card flex items-center justify-between px-6 py-3">
            <span className="font-display font-bold text-xl text-fore tracking-tight">
              시간조율
            </span>
            <nav className="flex items-center gap-2">
              <Link href="/my" className="neu-btn neu-btn-secondary px-5 py-2.5 text-sm">
                내 약속
              </Link>
              <Link href="/meetings/new" className="neu-btn neu-btn-primary px-5 py-2.5 text-sm">
                약속 잡기
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8"
              style={{
                background: "rgba(68,220,234,0.08)",
                border: "1px solid rgba(68,220,234,0.2)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-sm font-medium text-accent/80">무료 · 회원가입 불필요</span>
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-bold text-fore leading-tight tracking-tight mb-6">
              약속 시간,<br />
              <span className="text-accent">쉽게</span> 맞추세요
            </h1>

            <p className="text-lg text-muted leading-relaxed mb-10 max-w-md">
              참가자들이 불가능한 시간을 표시하면,<br />
              가장 많은 사람이 참석 가능한 시간을<br />
              자동으로 찾아드립니다.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/meetings/new" className="neu-btn neu-btn-primary px-8 py-4 text-base">
                <Calendar size={18} strokeWidth={2} />
                약속 잡기
              </Link>
              <Link href="/my" className="neu-btn neu-btn-secondary px-8 py-4 text-base">
                내 약속 보기
              </Link>
            </div>
          </div>

          {/* Right: Glowing orb */}
          <div className="flex justify-center lg:justify-end">
            <div className="animate-float w-72 h-72 sm:w-80 sm:h-80 relative flex items-center justify-center">
              {/* Outer halo */}
              <div className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(68,220,234,0.05) 0%, transparent 70%)",
                  border: "1px solid rgba(68,220,234,0.1)",
                }}
              />
              {/* Middle ring */}
              <div className="absolute w-52 h-52 sm:w-56 sm:h-56 rounded-full"
                style={{ border: "1px solid rgba(68,220,234,0.18)" }}
              />
              {/* Core orb */}
              <div
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center neu-glow-pulse"
                style={{
                  background: "radial-gradient(circle at 40% 40%, rgba(68,220,234,0.22), rgba(68,220,234,0.05))",
                  border: "1px solid rgba(68,220,234,0.4)",
                }}
              >
                <Calendar size={34} strokeWidth={1.5} className="text-accent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <p className="font-display text-sm font-semibold text-accent tracking-widest uppercase mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold text-fore tracking-tight">
            3단계로 끝납니다
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: "01", title: "약속 잡기", desc: "약속 이름, 날짜 범위, 응답 마감일을 설정하고 약속을 만듭니다.", icon: Calendar },
            { num: "02", title: "참가자 응답", desc: "초대 링크를 공유하면 참가자들이 불가능한 시간대를 선택합니다.", icon: Users },
            { num: "03", title: "최적 시간 확정", desc: "가장 많은 사람이 참석 가능한 시간을 계산해 보여줍니다.", icon: CheckCircle },
          ].map((step) => (
            <div key={step.num} className="neu-card neu-card-interactive p-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(68,220,234,0.1)", border: "1px solid rgba(68,220,234,0.2)" }}>
                <span className="font-display text-base font-bold text-accent">{step.num}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-base neu-inset-sm flex items-center justify-center mb-5">
                <step.icon size={16} strokeWidth={1.5} className="text-muted" />
              </div>
              <h3 className="font-display text-xl font-bold text-fore mb-3">{step.title}</h3>
              <p className="text-muted leading-relaxed text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <p className="font-display text-sm font-semibold text-accent tracking-widest uppercase mb-3">
            Features
          </p>
          <h2 className="font-display text-3xl font-bold text-fore tracking-tight">
            왜 시간조율인가요
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { icon: Shield,    title: "간편한 참여",  desc: "별도 회원가입 없이 이름과 전화번호만으로 참여할 수 있습니다." },
            { icon: RefreshCw, title: "실시간 현황",  desc: "주최자는 실시간으로 응답 현황과 최적 시간을 확인할 수 있습니다." },
            { icon: Zap,       title: "응답 수정 가능", desc: "제출 후에도 링크를 통해 언제든지 응답을 수정할 수 있습니다." },
            { icon: CheckCircle, title: "스마트 분석", desc: "참석 가능 인원이 가장 많은 시간대 순으로 자동 정렬합니다." },
          ].map((f) => (
            <div key={f.title} className="neu-card neu-card-interactive p-8 flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(68,220,234,0.08)", border: "1px solid rgba(68,220,234,0.18)" }}>
                <f.icon size={20} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-fore mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="neu-card p-12 sm:p-16 text-center"
          style={{ background: "linear-gradient(135deg, #111115 0%, #13131A 100%)" }}>
          {/* Accent orb */}
          <div className="flex justify-center mb-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center neu-glow-pulse"
              style={{
                background: "radial-gradient(circle at 40% 40%, rgba(68,220,234,0.25), rgba(68,220,234,0.06))",
                border: "1px solid rgba(68,220,234,0.35)",
              }}
            >
              <Calendar size={24} strokeWidth={1.5} className="text-accent" />
            </div>
          </div>

          <h2 className="font-display text-4xl font-bold text-fore tracking-tight mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-muted text-lg mb-10 max-w-md mx-auto">
            무료로 이용할 수 있습니다. 회원가입이 필요 없습니다.
          </p>
          <Link href="/meetings/new" className="neu-btn neu-btn-primary px-10 py-4 text-base">
            <Calendar size={20} strokeWidth={2} />
            약속 잡기 시작
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <span className="font-display font-bold text-fore/40 text-sm">시간조율</span>
        <p className="text-sm text-muted/60">© 2026</p>
      </footer>
    </div>
  );
}
