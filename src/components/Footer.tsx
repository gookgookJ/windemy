import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 회사 정보 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">(주) 어베어</h3>
          <div className="text-sm text-muted-foreground space-y-1 leading-relaxed">
            <p>주소 : 서울특별시 강남구 테헤란로252길 6-9, 4층 434호 | 대표이사 : 김승현</p>
            <p>사업자등록번호 : 885-88-02289 | 통신판매업 신고번호 : 2021-서울송파-3469</p>
            <p>전화 : 1661-4939 | 일반 문의 : support@windly.cc | 제휴 문의 : partnership@windly.cc</p>
          </div>
        </div>

        {/* 저작권 및 네비게이션 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">© Abear Corp.</p>
          
          <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              서비스 이용약관
            </Link>
            <Link 
              to="/faq" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보 처리방침
            </Link>
            <Link 
              to="/instructor-apply" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              유튜브
            </Link>
            <a 
              href="https://cafe.naver.com/richsellerproject" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              네이버 블로그
            </a>
            <a 
              href="https://www.instagram.com/windly_academy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              인스타그램
            </a>
            <Link 
              to="/inquiry" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              채용
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;