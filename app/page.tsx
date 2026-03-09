import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* ── Header ── */}
      <header className="border-b border-black">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-widest uppercase">
            시간조율
          </span>
          <Link
            href="/my"
            className="text-sm tracking-widest uppercase border-b border-transparent hover:border-black transition-all duration-100 pb-0.5"
          >
            내 약속
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        {/* Editorial eyebrow */}
        <p className="font-mono text-xs tracking-widest uppercase text-dim mb-8">
          No. 001 — 일정 조율 서비스
        </p>

        {/* Thick rule with square accent */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-[6px] flex-1 bg-black" />
          <div className="w-4 h-4 border-2 border-black" />
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-10">
          약속 시간,<br />
          <span className="italic font-bold">쉽게</span> 맞추세요
        </h1>

        <div className="h-px bg-black mb-10" />

        {/* Sub-copy + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <p className="font-serif text-lg text-dim leading-relaxed max-w-md">
            참가자들이 불가능한 시간을 표시하면,<br />
            가장 많은 사람이 참석 가능한 시간을<br />
            자동으로 찾아드립니다.
          </p>
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
          >
            약속 잡기
            <span className="font-display">→</span>
          </Link>
        </div>
      </section>

      {/* ── Section divider ── */}
      <div className="h-[4px] bg-black" />

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            이용 방법
          </h2>
          <span className="font-mono text-xs tracking-widest uppercase text-dim">
            3 Steps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black">
          {[
            {
              num: "01",
              title: "약속 잡기",
              desc: "약속 이름, 날짜 범위, 응답 마감일을 설정하고 약속을 만듭니다.",
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
          ].map((step, i) => (
            <div
              key={step.num}
              className={`p-8 ${i < 2 ? "md:border-r border-b md:border-b-0 border-black" : ""}`}
            >
              <span className="font-display text-5xl font-bold text-dim/30 block mb-6 leading-none">
                {step.num}
              </span>
              <div className="h-[2px] bg-black mb-6" />
              <h3 className="font-serif text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-dim text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section divider ── */}
      <div className="h-[4px] bg-black" />

      {/* ── Inverted features ── */}
      <section className="relative bg-black text-white overflow-hidden texture-invert">
        <div className="relative max-w-5xl mx-auto px-6 py-20 z-10">
          <p className="font-mono text-xs tracking-widest uppercase text-white/40 mb-12">
            Features
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-white/20">
            {[
              {
                title: "간편한 참여",
                desc: "별도 회원가입 없이 이름과 전화번호만으로 참여할 수 있습니다.",
              },
              {
                title: "실시간 현황",
                desc: "주최자는 실시간으로 응답 현황과 최적 시간을 확인할 수 있습니다.",
              },
              {
                title: "응답 수정 가능",
                desc: "제출 후에도 링크를 통해 언제든지 응답을 수정할 수 있습니다.",
              },
              {
                title: "스마트 분석",
                desc: "참석 가능 인원이 가장 많은 시간대 순으로 자동 정렬합니다.",
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`p-8 group hover:bg-white hover:text-black transition-colors duration-100 ${
                  i % 2 === 0 ? "sm:border-r border-white/20" : ""
                } ${i < 2 ? "border-b border-white/20" : ""}`}
              >
                <div className="h-[2px] bg-white group-hover:bg-black mb-6 transition-colors duration-100" />
                <h3 className="font-serif text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-white/60 group-hover:text-black/60 text-sm leading-relaxed transition-colors duration-100">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section divider ── */}
      <div className="h-[4px] bg-black" />

      {/* ── Footer ── */}
      <footer className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <span className="font-display text-sm font-bold tracking-widest uppercase">
          시간조율
        </span>
        <p className="font-mono text-xs text-dim tracking-wide">
          © 2026
        </p>
      </footer>
    </div>
  );
}
