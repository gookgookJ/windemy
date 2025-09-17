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
    <section className="w-full py-16 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 - 베스트글 */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">오늘의 베스트글</h3>
              </div>
              <div className="space-y-4">
                {bestPosts.map((post, index) => (
                  <div key={index} className="group">
                    <a 
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
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

          {/* 가운데 - 정보 카드 */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl text-white">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-white/90" />
              </div>
              <div className="space-y-2 mb-6">
                <div className="text-white/90 text-sm font-medium">
                  보기만해도 매출 상승하는
                </div>
                <div className="text-lg font-bold">사업 꿀팁</div>
                <div className="text-white/90 text-sm">
                  최신 이커머스 시장 트렌드
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-white/80" />
                <div className="text-xs text-white/80">
                  전문가들이 공유하는<br />
                  검증된 수익 전략
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 오른쪽 - 구독하기 */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Mail className="h-10 w-10 mx-auto mb-3 text-white/90" />
                <div className="space-y-1">
                  <div className="text-lg font-bold">돈 버는 이커머스 정보</div>
                  <div className="text-white/90">무료로 받아보기</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="이메일 주소 입력하고"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
                />
                <Button 
                  onClick={handleSubscribe}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                >
                  구독하기
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-white/70 text-center">
                놓치면 후회하는 정보를<br />
                가장 먼저 받아보세요
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default InfoBanner;