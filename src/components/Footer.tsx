import { ExternalLink, Youtube, MessageCircle, Instagram, GraduationCap, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-background via-muted/30 to-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 메인 브랜딩 섹션 */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">윈들리아카데미</h2>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            전문가들과 함께하는 실무 중심 온라인 교육 플랫폼
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* 서비스 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              서비스
            </h3>
            <nav className="space-y-3">
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                윈들리 소개
              </Link>
              <Link to="/faq" className="block text-muted-foreground hover:text-primary transition-colors">
                자주 묻는 질문
              </Link>
              <Link to="/instructor-apply" className="block text-muted-foreground hover:text-primary transition-colors">
                강사 지원하기
              </Link>
            </nav>
          </div>

          {/* 이용 안내 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              이용 안내
            </h3>
            <nav className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                이용약관
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                개인정보처리방침
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                환불정책
              </a>
            </nav>
          </div>

          {/* 소셜 & 커뮤니티 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">소셜 & 커뮤니티</h3>
            <div className="space-y-3">
              <a 
                href="https://cafe.naver.com/richsellerproject" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </div>
                네이버 카페
              </a>
              <a 
                href="https://www.instagram.com/windly_academy/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Instagram className="w-4 h-4" />
                </div>
                인스타그램
              </a>
              <a 
                href="#"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Youtube className="w-4 h-4" />
                </div>
                유튜브
              </a>
            </div>
          </div>

          {/* 고객 지원 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">고객 지원</h3>
            <div className="space-y-4">
              <Link to="/inquiry">
                <Button className="w-full" size="sm">
                  문의하기
                </Button>
              </Link>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">운영시간</p>
                <p>평일 10:00 - 18:00</p>
                <p>점심시간 12:00 - 13:00</p>
                <p className="text-xs">주말 및 공휴일 제외</p>
              </div>
              <a 
                href="mailto:edu@windly.cc"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                edu@windly.cc
              </a>
            </div>
          </div>
        </div>

        {/* 하단 회사 정보 */}
        <div className="border-t border-border pt-8">
          <div className="text-xs text-muted-foreground/80 space-y-1 leading-relaxed">
            <p>(주) 어베어 | 대표: 김승현 | 개인정보관리책임자: 김승현</p>
            <p>사업자등록번호: 885-88-02289 | 통신판매업 신고번호: 2021-서울송파-3469</p>
            <p>주소: 서울특별시 강남구 테헤란로 252길 6-9, 4층 434호 | 전화번호: 1661-4939</p>
            <p className="mt-3 text-center">© 2024 윈들리아카데미. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;