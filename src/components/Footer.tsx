import { ExternalLink, Youtube, MessageCircle, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* 첫 번째 컬럼 - 서비스 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">서비스</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-200">
                  윈데미 소개
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-white transition-colors duration-200">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  서비스 이용약관
                </a>
              </li>
            </ul>
          </div>

          {/* 두 번째 컬럼 - 개인정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">개인정보</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  제휴
                </a>
              </li>
            </ul>
          </div>

          {/* 세 번째 컬럼 - 소셜 미디어 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">소셜 미디어</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  블로그
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  Youtube
                </a>
              </li>
              <li>
                <Link to="/instructor-apply" className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  강사 지원하기
                </Link>
              </li>
            </ul>
          </div>

          {/* 네 번째 컬럼 - 커뮤니티 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">커뮤니티</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://cafe.naver.com/richsellerproject" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  네이버 카페
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/windly_academy/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  인스타그램
                </a>
              </li>
              <li>
                <a 
                  href="mailto:edu@windly.cc"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  비즈니스/제휴 문의
                </a>
              </li>
            </ul>
          </div>

          {/* 다섯 번째 컬럼 - 문의하기 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">문의하기</h3>
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <Link to="/inquiry">
                <Button 
                  variant="secondary" 
                  className="w-full bg-white text-slate-900 hover:bg-gray-100 font-medium"
                >
                  문의하기
                </Button>
              </Link>
              <div className="text-sm text-gray-400 space-y-1">
                <p>평일 10:00 - 18:00</p>
                <p>점심시간 12 - 13시 | 주말 및 공휴일 제외</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 회사 정보 */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="text-sm text-gray-400 space-y-2">
            <p>윈들리아카데미(주) | 대표 이정원 | 사업자등록번호 321-86-00842 | 통신판매업 신고번호 제2022-서울서초-2692호</p>
            <p>주소 서울특별시 강남구 역삼로17길 57 | 개인정보관리책임자 김태훈 | 대표번호 02-6392-0000</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;