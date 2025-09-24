import { useState, useEffect, useRef } from "react"; // ✨ useEffect, useRef 추가
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, BookOpen, CreditCard, Heart, FileText, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { SearchDropdown } from "@/components/SearchDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

const HEADER_HEIGHT = 64; // ✨ 헤더 높이 (h-16 = 64px)
const HEADER_SCROLL_THRESHOLD = 5; // ✨ 헤더 숨김 시작점

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // ✨ --- 스크롤 감지 로직 추가 (모바일에서만 동작) ---
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // PC/태블릿에서는 항상 헤더 표시
      if (!isMobile) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= HEADER_SCROLL_THRESHOLD) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      if (currentScrollY > lastScrollY.current) {
        setIsVisible(false); // 스크롤 내릴 때
      } else {
        setIsVisible(true); // 스크롤 올릴 때
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  // ✨ --- 여기까지 ---

  const navigationItems = [
    { name: "소개", href: "/about" },
    { 
      name: "클래스", 
      href: "/courses",
      submenu: [
        { name: "전체", href: "/courses" },
        { name: "무료강의", href: "/courses/free-courses" },
        { name: "VOD 강의", href: "/courses/vod-courses" },
        { name: "프리미엄 강의", href: "/courses/premium-courses" },
      ]
    },
    { name: "강사 지원", href: "/instructor-apply" },
  ];

  // MyPage menu items
  const myPageMenuItems = [
    { name: "내 강의실", href: "/my-page", icon: BookOpen },
    { name: "구매 내역", href: "/purchase-history", icon: CreditCard },
    { name: "관심 클래스", href: "/favorite-courses", icon: Heart },
    { name: "후기 관리", href: "/review-management", icon: FileText },
    { name: "1:1 문의", href: "https://windemy.channel.io/home", icon: Clock, external: true },
    { name: "회원정보관리", href: "/profile-settings", icon: User },
  ];

  // Check if current page is MyPage related
  const isMyPageRoute = location.pathname.startsWith('/my-page') || 
                       location.pathname.startsWith('/purchase-history') ||
                       location.pathname.startsWith('/favorite-courses') ||
                       location.pathname.startsWith('/review-management') ||
                       location.pathname.startsWith('/profile-settings');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    // ✨ className과 style 수정
    <header 
      className={`bg-white fixed top-0 left-0 right-0 z-50 font-sans transition-transform duration-300 ease-in-out sm:border-b sm:border-border sm:shadow-sm`}
      style={{ transform: isVisible ? 'translateY(0)' : `translateY(-${HEADER_HEIGHT}px)` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0 select-none">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-[18px] leading-none">W</span>
              </div>
              <span className="text-[20px] leading-none tracking-tight font-bold text-foreground whitespace-nowrap">윈들리아카데미</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {/* ... (내부 코드는 변경 없음) ... */}
              {navigationItems.map((item) => (
                <div key={item.name} className="relative group">
                  {item.submenu ? (
                    <>
                      <button className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium flex items-center gap-1">
                        {item.name}
                        <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-2">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors duration-200"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Search Bar - Hidden on MyPage routes */}
          {!isMyPageRoute && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <SearchDropdown />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Hide mobile search on MyPage routes */}
            {!isMyPageRoute && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Desktop admin button */}
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:block">
                    <Button variant="destructive" size="sm" className="text-xs whitespace-nowrap">
                      관리자
                    </Button>
                  </Link>
                )}
                <Link to="/my-page">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">내 강의실</span>
                  </Button>
                </Link>
                {/* Mobile hamburger menu */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signin');
                    setIsAuthModalOpen(true);
                  }}
                >
                  로그인
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setIsAuthModalOpen(true);
                  }}
                >
                  회원가입
                </Button>
              </div>
            )}
            {/* Tablet hamburger menu */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:block lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Dropdown - Hidden on MyPage routes */}
        {isMobileSearchOpen && !isMyPageRoute && (
          <div className="md:hidden border-t border-border bg-white px-4 py-4">
            <SearchDropdown onClose={() => setIsMobileSearchOpen(false)} />
          </div>
        )}

        {/* Mobile/Tablet Menu - Enhanced UI/UX */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white/95 backdrop-blur-md">
            <div className="px-6 py-6 space-y-6">
              
              <nav className="space-y-2">
                {isMyPageRoute ? (
                  // MyPage specific menu items with enhanced styling
                  <>
                    <div className="pb-2 mb-4 border-b border-border">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        마이페이지
                      </h3>
                    </div>
                    {myPageMenuItems.map((item) => (
                      <div key={item.name} className="animate-fade-in">
                        {item.external ? (
                          <button
                            className="w-full text-left group flex items-center gap-4 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-200 font-medium"
                            onClick={() => {
                              window.open(item.href, '_blank');
                              setIsMenuOpen(false);
                            }}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/30 group-hover:bg-primary/10 transition-colors duration-200">
                              <item.icon className="w-5 h-5 group-hover:text-primary transition-colors duration-200" />
                            </div>
                            <span className="text-base">{item.name}</span>
                          </button>
                        ) : (
                          <Link
                            to={item.href}
                            className="group flex items-center gap-4 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-200 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/30 group-hover:bg-primary/10 transition-colors duration-200">
                              <item.icon className="w-5 h-5 group-hover:text-primary transition-colors duration-200" />
                            </div>
                            <span className="text-base">{item.name}</span>
                          </Link>
                        )}
                      </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-border">
                      <button
                        className="w-full text-left group flex items-center gap-4 p-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 font-medium"
                        onClick={handleSignOut}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-200">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <span className="text-base">로그아웃</span>
                      </button>
                    </div>
                  </>
                ) : (
                  // Regular navigation items with enhanced styling
                  <>
                    <div className="pb-2 mb-4 border-b border-border">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        메뉴
                      </h3>
                    </div>
                    {navigationItems.map((item) => (
                      <div key={item.name} className="animate-fade-in">
                        <Link
                          to={item.href}
                          className="group flex items-center gap-4 p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-200 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/30 group-hover:bg-primary/10 transition-colors duration-200">
                            <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                          </div>
                          <span className="text-base">{item.name}</span>
                        </Link>
                        {item.submenu && (
                          <div className="ml-14 mt-2 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200 py-2 px-3 rounded-md hover:bg-muted/30"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {user && isAdmin && (
                      <div className="pt-4 mt-4 border-t border-border">
                        <Link 
                          to="/admin" 
                          className="group flex items-center gap-4 p-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors duration-200">
                            <div className="w-2 h-2 rounded-full bg-current"></div>
                          </div>
                          <span className="text-base">관리자</span>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </nav>
              
              {!user && !isMyPageRoute && (
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 text-base font-medium"
                      onClick={() => {
                        setAuthModalTab('signin');
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      로그인
                    </Button>
                    <Button 
                      variant="default" 
                      className="h-12 text-base font-medium"
                      onClick={() => {
                        setAuthModalTab('signup');
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      회원가입
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
};

export default Header;