import React, { useState, useEffect } from 'react';
import { ArrowRight, Video, Search, Clock, ChevronDown, Users, TrendingUp, Award, Lightbulb, Target, Zap, Star, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

const InstructorApply = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);

      // Show sticky button when scrolled past hero
      setShowStickyButton(winScroll > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFAQ = (index: number) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const faqData = [
    {
      question: "강의 경험이 없어도 가능한가요?",
      answer: "물론입니다. 해당 분야의 깊이 있는 전문성과 노하우만 있다면, 강의 기획부터 촬영, 편집까지 전담팀이 함께하며 최고의 콘텐츠를 만들 수 있도록 지원합니다."
    },
    {
      question: "수익 배분 구조는 어떻게 되나요?",
      answer: "수익 배분은 업계 최고 수준을 지향하며, 강사님의 기여도와 강의 형태, 마케팅 비용 분담 구조 등에 따라 투명하고 합리적인 방식으로 협의하여 결정합니다."
    },
    {
      question: "제작 기간과 비용은 어느 정도인가요?",
      answer: "윈들리 아카데미는 초기 제작 비용 부담 없이 시작할 수 있는 파트너십 모델을 기본으로 합니다. 제작 기간은 강의 분량과 복잡도에 따라 다르며, 보통 1~2개월 내외로 집중하여 진행됩니다."
    },
    {
      question: "온라인/오프라인 모두 가능한가요?",
      answer: "네, 온라인·오프라인·혼합형 모두 운영합니다. 대상·목표에 맞춰 최적 포맷을 제안하고, 각 형태별 특성에 맞는 최적의 제작 및 운영 지원을 제공합니다."
    }
  ];

  const categories = [
    { name: "프로그래밍", icon: "💻", desc: "웹개발, 앱개발, AI/ML" },
    { name: "디자인", icon: "🎨", desc: "UI/UX, 그래픽, 브랜딩" },
    { name: "마케팅", icon: "📈", desc: "디지털마케팅, SNS, 광고" },
    { name: "비즈니스", icon: "💼", desc: "창업, 경영전략, 투자" },
    { name: "크리에이티브", icon: "🎬", desc: "영상제작, 사진, 음악" },
    { name: "라이프스타일", icon: "🌱", desc: "요리, 운동, 취미" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-primary/5 to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="container mx-auto px-6 pt-20 pb-32 relative z-10 text-center">
          <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8 animate-fade-in">
            WINDLY ACADEMY INSTRUCTOR
          </span>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 animate-fade-in">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              최고의 전문가
            </span>
            를 위한<br />
            최상의 파트너십
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-12 animate-fade-in">
            윈들리 아카데미는 단순한 플랫폼이 아닙니다.<br />
            강사님의 지식과 경험이 가장 빛나는 브랜드가 될 수 있도록<br />
            <strong className="text-foreground">기획, 제작, 마케팅, 운영까지 전담</strong>합니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            <Button size="lg" className="text-lg px-10 py-6 hover:scale-105 transition-transform shadow-lg">
              지금 바로 지원하기
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10 py-6 hover:scale-105 transition-transform">
              성공 사례 보기
            </Button>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6">
        {/* Stats Section */}
        <section className="py-20 -mt-16 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6">
                <Users className="h-8 w-8" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">120+</div>
              <div className="text-sm text-muted-foreground font-medium">협력 강사 수</div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">평균 수익</div>
              <div className="text-sm text-muted-foreground font-medium">월 150만원+</div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">평균 제작</div>
              <div className="text-sm text-muted-foreground font-medium">6주 완성</div>
            </div>
          </div>
        </section>

        {/* Value Section */}
        <section className="py-24">
          <div className="text-center mb-20">
            <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8">
              WHY WINDLY
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-8">콘텐츠에만 집중하세요</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              강사님의 성공을 위해 윈들리 아카데미가 제공하는 핵심 지원 시스템입니다.<br />
              <strong className="text-foreground">나머지는 저희가 책임지겠습니다.</strong>
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <article className="bg-card border border-border rounded-3xl p-10 text-center hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 text-primary rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <Video className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-6">All-in-One 제작</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                기획부터 촬영, 편집, 디자인까지 최고의 전문가들로 구성된 전담팀이 함께합니다.
              </p>
            </article>
            <article className="bg-card border border-border rounded-3xl p-10 text-center hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 text-primary rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <Target className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-6">데이터 기반 마케팅</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                퍼포먼스 마케팅과 브랜딩을 통해 잠재 수강생에게 가장 효과적으로 도달합니다.
              </p>
            </article>
            <article className="bg-card border border-border rounded-3xl p-10 text-center hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 text-primary rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <Zap className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-6">운영 자동화 시스템</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                수강생 관리, CS, 정산 등 복잡한 운영 업무를 자동화하여 교육에만 집중하도록 돕습니다.
              </p>
            </article>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24">
          <div className="text-center mb-20">
            <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8">
              CATEGORIES
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-8">어떤 분야의 전문가신가요?</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              윈들리 아카데미에서는 다양한 분야의 전문가를 기다리고 있습니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{category.icon}</div>
                <h3 className="text-xl font-bold mb-3">{category.name}</h3>
                <p className="text-muted-foreground text-sm">{category.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who We Seek Section */}
        <section className="py-24">
          <div className="text-center mb-20">
            <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8">
              WHO WE SEEK
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-8">이런 전문가를 기다립니다</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              자신의 분야에서 독보적인 성과와 노하우를 가졌으며,<br />
              그 경험을 나누는 것에 열정을 가진 분이라면 누구든 환영합니다.
            </p>
          </div>
          <div className="bg-card border border-border rounded-3xl p-12 md:p-16 grid md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                지원 자격
              </h3>
              <ul className="space-y-6">
                {[
                  "검증된 성과를 보유하고, 실제 사례 공유가 가능한 분",
                  "자신만의 실행 중심 노하우를 명확하게 전달할 수 있는 분",
                  "수강생과의 적극적인 소통에 의지가 있으신 분",
                  "콘텐츠의 장기적인 성장과 확장에 관심이 있는 분"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-muted-foreground leading-relaxed text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Star className="h-8 w-8 text-primary" />
                제공 혜택
              </h3>
              <ul className="space-y-6">
                {[
                  "기획·제작·마케팅·운영 풀 스택 전담팀 배정",
                  "전환율을 높이는 카피라이팅 및 상세페이지 제작 지원",
                  "수강생 데이터 분석을 위한 통합 대시보드 제공",
                  "분야별 전문가와의 네트워킹 및 협업 기회"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-muted-foreground leading-relaxed text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24">
          <div className="text-center mb-20">
            <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8">
              HOW TO JOIN
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-8">합류 프로세스</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              최고의 전문가를 모시는 과정은 신중하지만, 빠르고 투명하게 진행됩니다.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "지원서 접수", desc: "기본 정보와 함께 전문 분야 및 강의 아이디어를 제출합니다.", color: "from-blue-500 to-primary" },
              { num: "2", title: "내부 검토", desc: "시장성과 차별성을 중심으로 내부 전문가 그룹이 신중하게 검토합니다.", color: "from-primary to-accent" },
              { num: "3", title: "온라인 미팅", desc: "강의 커리큘럼과 방향성에 대해 심도 깊은 논의를 진행합니다.", color: "from-accent to-primary" },
              { num: "4", title: "계약 및 파트너십", desc: "세부적인 협력 조건과 일정을 조율하고 파트너십을 체결합니다.", color: "from-primary to-accent" },
              { num: "5", title: "콘텐츠 제작", desc: "전담팀과 함께 강의 콘텐츠 제작 및 런칭 준비에 착수합니다.", color: "from-accent to-primary" },
              { num: "6", title: "런칭 & 성장", desc: "성공적인 런칭 이후, 데이터 기반으로 함께 성장 방안을 모색합니다.", color: "from-primary to-blue-500" }
            ].map((item, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`text-3xl font-black text-white bg-gradient-to-r ${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                  {item.num}
                </div>
                <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compare Section */}
        <section className="py-24">
          <div className="text-center mb-20">
            <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8">
              DIFFERENCE
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-8">혼자 할 때와 무엇이 다를까요?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted/30 border border-border rounded-3xl p-10">
              <h5 className="text-2xl font-black mb-8 flex items-center gap-3">
                <XCircle className="h-8 w-8 text-muted-foreground" />
                단독 진행
              </h5>
              <ul className="space-y-6">
                {[
                  "기획·촬영·편집·마케팅 등 모든 것을 직접 해결",
                  "수강생 모집과 CS에 상당한 시간과 노력 소요",
                  "객관적인 데이터 없이 감에 의존한 의사결정",
                  "제한적인 네트워킹과 협업 기회"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4 text-muted-foreground line-through">
                    <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border-2 border-primary rounded-3xl p-10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-2 text-sm font-bold rounded-bl-lg">
                RECOMMENDED
              </div>
              <h5 className="text-2xl font-black mb-8 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-primary" />
                윈들리 아카데미와 함께
              </h5>
              <ul className="space-y-6">
                {[
                  "오직 강의 콘텐츠에만 집중, 나머지는 전담팀이 실행",
                  "데이터 기반 마케팅으로 안정적인 수강생 확보",
                  "성과 분석 대시보드를 통한 투명한 성과 공유",
                  "최고 전문가 네트워크를 통한 무한한 성장 가능성"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground leading-relaxed text-lg font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24">
          <div className="text-center mb-20">
            <span className="inline-block px-6 py-3 bg-primary/10 text-primary text-sm font-bold tracking-wider rounded-full mb-8">
              FAQ
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-8">자주 묻는 질문</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqData.map((faq, index) => (
              <div 
                key={index} 
                className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 hover:bg-muted/30 ${
                  activeFAQ === index ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                <button
                  className="w-full p-8 flex justify-between items-center text-left font-bold text-xl hover:text-primary transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.question}
                  <ChevronDown 
                    className={`h-6 w-6 transition-transform duration-300 text-primary ${
                      activeFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeFAQ === index && (
                  <div className="px-8 pb-8 text-muted-foreground leading-relaxed text-lg animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-primary via-accent to-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        <div className="container mx-auto px-6 py-24 text-center relative z-10">
          <h3 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            이제 당신의 차례입니다
          </h3>
          <p className="text-2xl opacity-90 max-w-4xl mx-auto mb-12 leading-relaxed">
            윈들리 아카데미와 함께 당신의 지식을 브랜드로 만들고,<br />
            더 큰 성장을 경험하세요.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-primary border-white hover:bg-white/90 text-xl px-12 py-6 font-bold"
            >
              강사 지원하기
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-white border-white/20 border hover:bg-white/10 text-xl px-12 py-6 font-bold"
            >
              성공 사례 보기
            </Button>
          </div>
        </div>
      </section>

      {/* Sticky Apply Button */}
      {showStickyButton && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
          <Button className="shadow-2xl hover:scale-105 transition-transform text-lg px-8 py-4 font-bold">
            지금 지원하기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default InstructorApply;