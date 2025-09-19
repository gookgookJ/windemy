import { ExternalLink, Youtube, MessageCircle, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* 첫 번째 컬럼 - 서비스 정보 */}
          <div className="space-y-4">
            <h3 className="font-medium text-white text-sm mb-6">서비스</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  윈데미 소개
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link to="/instructor-apply" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  강사 지원하기
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:edu@windly.cc"
                  className="text-slate-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  비즈니스/제휴 문의
                </a>
              </li>
            </ul>
          </div>

          {/* 두 번째 컬럼 - 개인정보&이용약관 */}
          <div className="space-y-4">
            <h3 className="font-medium text-white text-sm mb-6">개인정보&이용약관</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  서비스 이용약관
                </a>
              </li>
            </ul>
          </div>

          {/* 세 번째 컬럼 - 소셜 미디어 */}
          <div className="space-y-4">
            <h3 className="font-medium text-white text-sm mb-6">소셜 미디어</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 text-sm">
                  <ExternalLink className="w-3.5 h-3.5" />
                  블로그
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 text-sm">
                  <Youtube className="w-3.5 h-3.5" />
                  Youtube
                </a>
              </li>
            </ul>
          </div>

          {/* 네 번째 컬럼 - 커뮤니티 */}
          <div className="space-y-4">
            <h3 className="font-medium text-white text-sm mb-6">커뮤니티</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://cafe.naver.com/richsellerproject" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  네이버 카페
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/windly_academy/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  인스타그램
                </a>
              </li>
            </ul>
          </div>

          {/* 다섯 번째 컬럼 - 문의하기 */}
          <div className="space-y-4">
            <div className="space-y-4">
              <Link to="/inquiry">
                <Button 
                  size="sm"
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium text-sm h-9"
                >
                  고객센터
                </Button>
              </Link>
              <div className="text-xs text-slate-500 space-y-1.5">
                <p>평일 10:00 - 18:00</p>
                <p>점심시간 12:30 - 13:30</p>
                <p>주말 및 공휴일 제외</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 회사 정보 */}
        <div className="border-t border-slate-800 mt-16 pt-8">
          <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
            <p>(주) 어베어 | 대표: 김승현 | 개인정보관리책임자: 김승현</p>
            <p>사업자등록번호: 885-88-02289 | 통신판매업 신고번호: 2021-서울송파-3469</p>
            <p>주소: 서울특별시 강남구 테헤란로 252길 6-9, 4층 434호 | 전화번호: 1661-4939</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;