import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

const InfoBanner = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    if (email) {
      // TODO: 실제 구독 로직 구현
      console.log('구독:', email);
      setEmail('');
    }
  };

  const bestPosts = [
    {
      title: "일본판 아마존닷컴, 메루카리(Mercari) 초보자 직구 가이드ㅣ회원가입부터 실전까지",
      url: "https://www.windly.cc/blog/mercari-japan-guide"
    },
    {
      title: "쿠팡파트너스 시작가이드ㅣ가입방법, 정산, 주의사항까지",
      url: "https://www.windly.cc/blog"
    },
    {
      title: "네이버 스마트스토어 상위노출 완벽 가이드",
      url: "https://www.windly.cc/blog"
    },
    {
      title: "중국 직구 사업 시작하기 - 알리바바 완전정복",
      url: "https://www.windly.cc/blog"
    },
    {
      title: "온라인 쇼핑몰 마케팅 전략 - ROI 200% 달성법",
      url: "https://www.windly.cc/blog"
    }
  ];

  return (
    <section className="w-full py-10 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 중앙 강조 텍스트 */}
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            보기만해도 매출 상승하는 이커머스 사업 꿀팁!
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* 왼쪽 - 최신 트렌드 (더 넓게) */}
          <div className="lg:col-span-6">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">최신 이커머스 시장 트렌드</h3>
                </div>
                <div className="space-y-2">
                  {bestPosts.map((post, index) => (
                    <div key={index} className="group">
                      <a 
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </span>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 - 구독하기 */}
          <div className="lg:col-span-4">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white h-full">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <Mail className="h-7 w-7 mx-auto mb-2 text-white/90" />
                <div className="space-y-1">
                  <div className="text-sm font-bold">돈 버는 이커머스 정보</div>
                  <div className="text-xs text-white/90">무료로 받아보기</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="이메일 주소 입력하고"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 text-sm"
                />
                <Button 
                  onClick={handleSubscribe}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm py-2"
                >
                  구독하기
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-white/70 text-center">
                놓치면 후회하는 정보를<br />
                가장 먼저 받아보세요
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoBanner;