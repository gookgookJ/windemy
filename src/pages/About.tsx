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

  useEffect(() => {
    const type = () => {
      const currentPhrase = phrases[phraseIndex];
      let typeSpeed = isDeleting ? 60 : 120;

      if (isDeleting) {
        if (charIndex > currentPhrase.text.length) {
          setCurrentParticle('');
          setCharIndex(prev => prev - 1);
        } else {
          setCurrentText(currentPhrase.text.substring(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
        }
      } else {
        if (charIndex < currentPhrase.text.length) {
          setCurrentText(currentPhrase.text.substring(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
        } else {
          setCurrentParticle(currentPhrase.particle);
          setCharIndex(prev => prev + 1);
        }
      }

      if (!isDeleting && charIndex === (currentPhrase.text.length + 1)) {
        typeSpeed = 2000;
        setIsDeleting(true);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex(prev => (prev + 1) % phrases.length);
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    };

    const timeout = setTimeout(type, 120);
    return () => clearTimeout(timeout);
  }, [phraseIndex, charIndex, isDeleting]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-primary text-xl font-medium mb-8 tracking-wider">
            WINDLY ACADEMY
          </h2>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-foreground">성공의 지름길은 없습니다.</span>
            <br />
            <span className="text-foreground">그러나 </span>
            <span className="text-primary inline-block">
              {currentText}
            </span>
            <span className="text-foreground">{currentParticle} 존재합니다.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            윈들리아카데미는 가장 확실한 성공의 길을 안내합니다.
          </p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            당신의 잠재력을 수익으로 바꾸는 여정, 지금 바로 시작하세요.
          </p>
        </div>
      </section>

      {/* By The Numbers Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-primary text-xl font-medium mb-4 tracking-wider">
            BY THE NUMBERS
          </h2>
          
          <p className="text-lg text-muted-foreground mb-16">
            숫자가 증명하는 윈들리아카데미의 가치
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-4">
                91%
              </div>
              <p className="text-lg text-muted-foreground">
                콘텐츠 만족도
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-4">
                241%
              </div>
              <p className="text-lg text-muted-foreground">
                수강 후 평균 수익 증가율
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-4">
                89%
              </div>
              <p className="text-lg text-muted-foreground">
                수강생 목표 달성률
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Principles Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-primary text-xl font-medium mb-4 tracking-wider">
              OUR PRINCIPLES
            </h2>
            
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              우리가 이기는 결과를 만드는
            </h3>
            
            <p className="text-3xl md:text-4xl font-bold text-primary">
              6가지 핵심 원칙
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-card border">
              <h4 className="text-xl font-semibold mb-4 text-primary">
                결과 중심 교육
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                수강생의 실제 수익 창출을 최우선 목표로, 모든 커리큘럼은 즉시 실행 가능한 액션 플랜 중심으로 구성됩니다.
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <h4 className="text-xl font-semibold mb-4 text-primary">
                검증된 전문가
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                해당 분야에서 직접 압도적인 성과를 낸 강사만이 무대에 오릅니다. 이론가가 아닌 실전가의 생생한 노하우를 전수합니다.
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <h4 className="text-xl font-semibold mb-4 text-primary">
                자동화 시스템 구축
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                단발성 수익을 넘어, 지속 가능한 현금 흐름을 만드는 '나만의 자동화 시스템' 구축법을 알려드립니다.
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <h4 className="text-xl font-semibold mb-4 text-primary">
                독보적 커뮤니티
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                성공을 향한 여정은 혼자일 수 없습니다. 같은 목표를 가진 동료들과 교류하며 함께 성장하는 강력한 커뮤니티를 제공합니다.
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <h4 className="text-xl font-semibold mb-4 text-primary">
                최신 트렌드 반영
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                시장은 끊임없이 변합니다. 윈들리아카데미는 가장 최신의 시장 트렌드와 플랫폼 로직을 분석하여 즉시 적용 가능한 전략을 제시합니다.
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <h4 className="text-xl font-semibold mb-4 text-primary">
                스파르타식 관리
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                의지가 약해도 괜찮습니다. 1:1 맞춤 피드백과 체계적인 관리 시스템으로 포기하지 않고 목표를 달성하도록 돕습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            이제 당신의 차례입니다.
          </h2>
          
          <p className="text-xl mb-8 opacity-90">
            윈들리아카데미와 함께라면, 경제적 자유는 더 이상 꿈이 아닙니다.
          </p>
          
          <a 
            href="/courses"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-background text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            모든 클래스 둘러보기 →
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;