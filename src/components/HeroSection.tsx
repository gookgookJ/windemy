import { Play, BookOpen, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-lms.jpg";

const HeroSection = () => {
  const stats = [
    { icon: BookOpen, label: "전체 강의", value: "2,000+" },
    { icon: Users, label: "수강생", value: "50,000+" },
    { icon: Award, label: "수료생", value: "30,000+" },
  ];

  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-primary-light via-background to-secondary-light overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0), 
                           radial-gradient(circle at 75px 75px, hsl(var(--secondary)) 1px, transparent 0)`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="flex items-center gap-3">
              <Badge className="bg-success text-success-foreground font-semibold px-4 py-2">
                🎉 2024년 최고의 온라인 교육 플랫폼
              </Badge>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                꿈을 현실로 만드는
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  온라인 교육
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                전문가들의 실무 경험이 담긴 고품질 강의로 
                여러분의 커리어를 한 단계 업그레이드하세요.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                무료 강의 체험하기
              </Button>
              <Button variant="outline" size="xl" className="border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary">
                전체 강의 둘러보기
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="온라인 교육 플랫폼"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-strong p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">진행 중인 강의</div>
                    <div className="text-xs text-muted-foreground">React 마스터 클래스</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-strong p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">수료증 획득</div>
                    <div className="text-xs text-muted-foreground">95% 완료율</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl -z-10" />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" fill="none" className="w-full h-20">
          <path
            d="M0,60 C300,100 900,20 1200,60 L1200,120 L0,120 Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;