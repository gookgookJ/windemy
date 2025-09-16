import { useState, useEffect } from 'react';
import { ThumbsUp, BarChart, Target, Edit, Shield, Settings, Users, Layers, SquareCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-background text-foreground font-sans"
         style={{ fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', Roboto, 'Noto Sans KR', 'Segoe UI', sans-serif" }}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-white opacity-0 translate-y-8 transition-all duration-700 -mt-16" style={{ padding: '140px 0' }} data-animate>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Cpath d='M25 50h50 M50 25v50' stroke='%23e1e4ed' stroke-width='0.5' fill='none'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E\")"
          }} />
        </div>
        <div className="mx-auto px-5 text-left" style={{ maxWidth: '1140px' }}>
          <h2 className="text-primary font-bold tracking-wide mb-4" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>WINDLY ACADEMY</h2>
          <h1 className="font-extrabold leading-tight mb-0" style={{ fontSize: '60px', lineHeight: 1.25 }}>
            성공의 지름길은 없습니다.
            <br />
            그러나 <span className="text-primary">{currentText}</span>
            <span className="text-foreground" style={{ paddingLeft: '4px' }}>{currentParticle}</span> 존재합니다.
          </h1>
          <div style={{ maxWidth: '680px' }}>
            <p className="text-muted-foreground mt-8" style={{ fontSize: '18px', lineHeight: 1.8 }}>
              윈들리아카데미는 가장 확실한 성공의 길을 안내합니다.
              <br />당신의 잠재력을 수익으로 바꾸는 여정, 지금 바로 시작하세요.
            </p>
          </div>
        </div>
      </section>

      {/* By The Numbers Section */}
      <section className="px-5" style={{ padding: '120px 20px' }} data-animate>
        <div className="mx-auto text-left" style={{ maxWidth: '1140px' }}>
          <h2 className="text-primary font-bold mb-4" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>BY THE NUMBERS</h2>
          <p className="text-foreground font-extrabold mb-6" style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.3, marginBottom: '24px' }}>
            숫자가 증명하는 윈들리아카데미의 가치
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 mt-15" style={{ gap: '30px', marginTop: '60px' }}>
            {[
              { label: '콘텐츠 만족도', value: 98, icon: ThumbsUp },
              { label: '수강 후 평균 수익 증가율', value: 350, icon: BarChart },
              { label: '수강생 목표 달성률', value: 92, icon: Target }
            ].map((stat, index) => (
              <div key={stat.label} className="bg-card border border-border rounded-2xl hover:border-primary hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group" style={{ padding: '32px', borderRadius: '20px' }} data-animate>
                <p className="text-muted-foreground font-semibold mb-3 group-hover:text-primary/80 transition-colors duration-300" style={{ fontSize: '17px', fontWeight: 600, margin: 0, marginBottom: '12px' }}>{stat.label}</p>
                <div className="flex items-center justify-between">
                  <div className="text-foreground font-extrabold" style={{ fontSize: '52px', fontWeight: 800 }}>
                    <span data-count={stat.value}>0</span>%
                  </div>
                  <div className="flex items-center justify-center bg-primary/10 rounded-xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                    <stat.icon className="text-primary" style={{ width: '26px', height: '26px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Principles Section */}
      <section className="px-5" style={{ padding: '120px 20px' }}>
        <div className="mx-auto" style={{ maxWidth: '1140px' }}>
          <div className="text-left mb-15" style={{ marginBottom: '60px' }} data-animate>
            <h2 className="text-primary font-bold mb-4" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>OUR PRINCIPLES</h2>
            <p className="text-foreground font-extrabold leading-tight" style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.3, marginBottom: '24px' }}>
              우리가 이기는 결과를 만드는
              <br />
              <span className="text-primary">6가지 핵심 원칙</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '30px' }}>
            {[
              { title: '결과 중심 교육', desc: '수강생의 실제 수익 창출을 최우선 목표로, 모든 커리큘럼은 즉시 실행 가능한 액션 플랜 중심으로 구성됩니다.', icon: Edit },
              { title: '검증된 전문가', desc: '해당 분야에서 직접 압도적인 성과를 낸 강사만이 무대에 오릅니다. 이론가가 아닌 실전가의 생생한 노하우를 전수합니다.', icon: Shield },
              { title: '자동화 시스템 구축', desc: "단발성 수익을 넘어, 지속 가능한 현금 흐름을 만드는 '나만의 자동화 시스템' 구축법을 알려드립니다.", icon: Settings },
              { title: '독보적 커뮤니티', desc: '성공을 향한 여정은 혼자일 수 없습니다. 같은 목표를 가진 동료들과 교류하며 함께 성장하는 강력한 커뮤니티를 제공합니다.', icon: Users },
              { title: '최신 트렌드 반영', desc: '시장은 끊임없이 변합니다. 윈들리아카데미는 가장 최신의 시장 트렌드와 플랫폼 로직을 분석하여 즉시 적용 가능한 전략을 제시합니다.', icon: Layers },
              { title: '스파르타식 관리', desc: '의지가 약해도 괜찮습니다. 1:1 맞춤 피드백과 체계적인 관리 시스템으로 포기하지 않고 목표를 달성하도록 돕습니다.', icon: SquareCheck },
            ].map((principle, index) => (
              <div key={principle.title} className="bg-card border border-border hover:border-primary hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group" style={{ borderRadius: '24px', padding: '32px' }} data-animate>
                <div className="flex items-center justify-center bg-primary/10 mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300" style={{ width: '60px', height: '60px', borderRadius: '16px' }}>
                  <principle.icon className="text-primary" style={{ width: '30px', height: '30px' }} />
                </div>
                <h4 className="text-foreground font-bold mb-3 group-hover:text-primary transition-colors duration-300" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{principle.title}</h4>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300" style={{ fontSize: '16px', lineHeight: 1.7, margin: 0 }}>{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="px-5" style={{ paddingBottom: '120px' }}>
        <div className="mx-auto" style={{ maxWidth: '1140px' }} data-animate>
          <div className="bg-primary text-primary-foreground flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-2xl transition-all duration-300" style={{ borderRadius: '30px', padding: '80px 60px' }}>
            <div className="mb-8 md:mb-0">
              <h2 className="font-bold mb-3 leading-snug" style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1.4, marginBottom: '12px' }}>이제 당신의 차례입니다.</h2>
              <p className="opacity-80" style={{ fontSize: '18px', margin: 0 }}>윈들리아카데미와 함께라면, 경제적 자유는 더 이상 꿈이 아닙니다.</p>
            </div>
            <a
              href="/courses"
              className="inline-flex items-center justify-center gap-2 bg-background text-foreground font-bold hover:bg-muted hover:scale-105 transition-all duration-200 hover:-translate-y-1 flex-shrink-0 group border border-transparent"
              style={{ padding: '18px 36px', borderRadius: '100px', fontSize: '16px', fontWeight: 700 }}
            >
              <span>모든 클래스 둘러보기</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;