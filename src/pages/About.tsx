import { useState, useEffect } from 'react';
import Header from '@/components/Header';

const About = () => {
  const [currentText, setCurrentText] = useState('');
  const [currentParticle, setCurrentParticle] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const phrases = [
    { text: "'이기는 전략'", particle: "은" },
    { text: "'성공 설계도'", particle: "는" },
    { text: "'수익화 시스템'", particle: "은" }
  ];

  // Robust typing effect (single timer)
  useEffect(() => {
    const current = phrases[phraseIndex];
    let speed = isDeleting ? 60 : 120;

    // when finished typing, show particle and pause
    if (!isDeleting && charIndex === current.text.length) {
      setCurrentParticle(current.particle);
      speed = 2000;
    }

    const timer = setTimeout(() => {
      if (isDeleting) {
        if (charIndex > 0) {
          setCurrentText(current.text.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setCurrentParticle('');
          setPhraseIndex((phraseIndex + 1) % phrases.length);
        }
      } else {
        if (charIndex < current.text.length) {
          setCurrentText(current.text.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setIsDeleting(true);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [phraseIndex, charIndex, isDeleting]);

  // Scroll reveal for sections
  useEffect(() => {
    const els = document.querySelectorAll('[data-animate]');
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Count-up animation for stats
  useEffect(() => {
    const els = document.querySelectorAll('[data-count]');
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement & { dataset: DOMStringMap };
            if (el.dataset.animated === 'true') return;
            el.dataset.animated = 'true';
            const target = parseInt(el.dataset.count || '0', 10);
            const start = performance.now();
            const duration = 2000;
            const step = (now: number) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.floor(eased * target).toLocaleString();
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--wind-bg-light))', color: 'hsl(var(--wind-text-primary))', fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', Roboto, 'Noto Sans KR', 'Segoe UI', sans-serif" }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b opacity-0 translate-y-8 transition-all duration-700" style={{ borderColor: 'hsl(var(--wind-border-color))' }} data-animate>
        {/* background pattern */}
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 80% at 20% -20%, rgba(0,90,238,0.08), transparent), url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='none'/%3E%3Cpath d='M25 50h50 M50 25v50' stroke-width='0.5' stroke='%23e1e4ed' fill='none'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23a)'/%3E%3C/svg%3E\")",
          backgroundColor: 'hsl(var(--bg-white, 0 0% 100%))'
        }} />
        <div className="max-w-[1140px] mx-auto px-5 py-[140px] text-left">
          <h2 className="text-sm font-bold tracking-wide mb-4" style={{ color: 'hsl(var(--wind-brand-blue))' }}>WINDLY ACADEMY</h2>
          <h1 className="font-extrabold leading-tight hero-headline" style={{ fontSize: '60px' }}>
            성공의 지름길은 없습니다.
            <br />
            그러나 <span className="highlight" style={{ color: 'hsl(var(--wind-brand-blue))' }}>{currentText}</span>
            <span id="typing-particle" style={{ paddingLeft: 4 }}>{currentParticle}</span> 존재합니다.
          </h1>
          <p className="section-body mt-8" style={{ color: 'hsl(var(--wind-text-secondary))', maxWidth: 680, lineHeight: 1.8 }}>
            윈들리아카데미는 가장 확실한 성공의 길을 안내합니다.
            <br />당신의 잠재력을 수익으로 바꾸는 여정, 지금 바로 시작하세요.
          </p>
        </div>
      </section>

      {/* By The Numbers Section */}
      <section className="py-20 px-5" data-animate>
        <div className="max-w-[1140px] mx-auto text-left">
          <h2 className="section-eyebrow mb-2 font-bold" style={{ color: 'hsl(var(--wind-brand-blue))' }}>BY THE NUMBERS</h2>
          <p className="section-headline mb-10 font-extrabold" style={{ color: 'hsl(var(--wind-text-primary))', fontSize: 48, lineHeight: 1.3 }}>
            숫자가 증명하는 윈들리아카데미의 가치
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mt-6">
            {[{label:'콘텐츠 만족도',value:98},{label:'수강 후 평균 수익 증가율',value:350},{label:'수강생 목표 달성률',value:92}].map((s, i) => (
              <div key={s.label} className="stat-card p-8 rounded-2xl border bg-white transition-transform duration-300" style={{ borderColor: 'hsl(var(--wind-border-color))' }} data-animate>
                <p className="stat-label text-[17px] font-semibold mb-3" style={{ color: 'hsl(var(--wind-text-secondary))' }}>{s.label}</p>
                <div className="flex items-center justify-between">
                  <div className="stat-number text-[52px] font-extrabold" style={{ color: 'hsl(var(--wind-text-primary))' }}>
                    <span data-count={s.value}>0</span>%
                  </div>
                  <div className="stat-icon w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--wind-brand-light-blue))', color: 'hsl(var(--wind-brand-blue))' }}>
                    {/* decorative dot */}
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--wind-brand-blue))' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Principles Section */}
      <section className="py-20 px-5">
        <div className="max-w-[1140px] mx-auto">
          <div className="text-left mb-12" data-animate>
            <h2 className="section-eyebrow mb-2 font-bold" style={{ color: 'hsl(var(--wind-brand-blue))' }}>OUR PRINCIPLES</h2>
            <p className="section-headline font-extrabold" style={{ color: 'hsl(var(--wind-text-primary))', fontSize: 36, lineHeight: 1.3 }}>
              우리가 이기는 결과를 만드는
              <br />
              <span className="text-[hsl(var(--wind-brand-blue))]" style={{ color: 'hsl(var(--wind-brand-blue))' }}>6가지 핵심 원칙</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              {title:'결과 중심 교육', desc:'수강생의 실제 수익 창출을 최우선 목표로, 모든 커리큘럼은 즉시 실행 가능한 액션 플랜 중심으로 구성됩니다.'},
              {title:'검증된 전문가', desc:'해당 분야에서 직접 압도적인 성과를 낸 강사만이 무대에 오릅니다. 이론가가 아닌 실전가의 생생한 노하우를 전수합니다.'},
              {title:'자동화 시스템 구축', desc:"단발성 수익을 넘어, 지속 가능한 현금 흐름을 만드는 '나만의 자동화 시스템' 구축법을 알려드립니다."},
              {title:'독보적 커뮤니티', desc:'성공을 향한 여정은 혼자일 수 없습니다. 같은 목표를 가진 동료들과 교류하며 함께 성장하는 강력한 커뮤니티를 제공합니다.'},
              {title:'최신 트렌드 반영', desc:'시장은 끊임없이 변합니다. 윈들리아카데미는 가장 최신의 시장 트렌드와 플랫폼 로직을 분석하여 즉시 적용 가능한 전략을 제시합니다.'},
              {title:'스파르타식 관리', desc:'의지가 약해도 괜찮습니다. 1:1 맞춤 피드백과 체계적인 관리 시스템으로 포기하지 않고 목표를 달성하도록 돕습니다.'},
            ].map((p) => (
              <div key={p.title} className="rounded-3xl p-8 border bg-white transition-transform duration-300 hover:-translate-y-2" style={{ borderColor: 'hsl(var(--wind-border-color))' }} data-animate>
                <div className="w-[60px] h-[60px] rounded-2xl mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--wind-brand-light-blue))', color: 'hsl(var(--wind-brand-blue))' }}>
                  <div className="w-[30px] h-[30px] rounded-md" style={{ backgroundColor: 'hsl(var(--wind-brand-blue))', opacity: 0.9 }} />
                </div>
                <h4 className="text-xl font-semibold mb-3" style={{ color: 'hsl(var(--wind-text-primary))' }}>{p.title}</h4>
                <p className="text-[16px] leading-7" style={{ color: 'hsl(var(--wind-text-secondary))' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="px-5 pb-24">
        <div className="max-w-[1140px] mx-auto" data-animate>
          <div className="rounded-[30px] px-8 py-16 flex flex-col md:flex-row md:items-center md:justify-between" style={{ backgroundColor: 'hsl(var(--wind-dark-blue))' }}>
            <div className="text-white">
              <h2 className="text-3xl md:text-[36px] font-bold leading-snug mb-3">이제 당신의 차례입니다.</h2>
              <p className="text-lg opacity-80 m-0">윈들리아카데미와 함께라면, 경제적 자유는 더 이상 꿈이 아닙니다.</p>
            </div>
            <a
              href="/courses"
              className="mt-8 md:mt-0 inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full font-bold border transition-transform duration-200 hover:-translate-y-1"
              style={{ backgroundColor: 'hsl(0 0% 100%)', color: 'hsl(var(--wind-dark-blue))', borderColor: 'transparent' }}
            >
              <span>모든 클래스 둘러보기</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;