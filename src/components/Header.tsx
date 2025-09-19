import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, User, Menu, X, Home, BookOpen, UserCheck, Calendar, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { SearchDropdown } from "@/components/SearchDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();

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

  const mobileCategories = [
    { name: "전체", href: "/courses", active: true },
    { name: "내집마련", href: "/courses/real-estate" },
    { name: "베스트", href: "/courses/best" },
    { name: "커리클럽", href: "/courses/career" },
    { name: "오픈예정", href: "/courses/upcoming" },
    { name: "강의위트지식", href: "/courses/knowledge" },
  ];

  const bottomNavItems = [
    { name: "클래스", href: "/courses", icon: BookOpen },
    { name: "커뮤니티", href: "/community", icon: UserCheck },
    { name: "카테고리", href: "/categories", icon: Menu },
    { name: "구해내자", href: "/find-it", icon: Home },
    { name: "마이페이지", href: "/my-page", icon: User },
  ];

  // Scroll behavior for mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile]);

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <AnimatePresence>
          {showHeader && (
            <motion.header 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-b border-border fixed top-0 left-0 right-0 z-50 shadow-soft font-sans"
            >
              <div className="px-4">
                <div className="flex items-center justify-between h-14">
                  {/* Logo */}
                  <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
                    <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">윈들리아카데미</span>
                  </Link>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8"
                      onClick={() => setMobileSearchOpen(true)}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                    
                    {user ? (
                      <Link to="/my-page">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <User className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => {
                          setAuthModalTab('signin');
                          setIsAuthModalOpen(true);
                        }}
                      >
                        로그인
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile Category Tabs */}
                <div className="flex overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                  <div className="flex space-x-4 min-w-max">
                    {mobileCategories.map((category) => (
                      <Link
                        key={category.name}
                        to={category.href}
                        className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-full transition-colors ${
                          category.active 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Sticky Search Bar when scrolled */}
        <AnimatePresence>
          {isScrolled && !showHeader && (
            <motion.div
              initial={{ y: -60 }}
              animate={{ y: 0 }}
              exit={{ y: -60 }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm"
            >
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="어떤 강의를 찾고 계신가요?"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    onClick={() => setMobileSearchOpen(true)}
                    readOnly
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Search Modal */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-white"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center px-4 py-3 border-b border-border">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMobileSearchOpen(false)}
                    className="mr-3"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <SearchDropdown />
                  </div>
                </div>
                <div className="flex-1 p-4">
                  {/* Search results would go here */}
                  <p className="text-muted-foreground text-center mt-8">검색어를 입력해주세요</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border">
          <div className="flex">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex-1 flex flex-col items-center py-2 px-1"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </>
    );
  }

  // Desktop Header
  return (
    <header className="bg-white border-b border-border fixed top-0 left-0 right-0 z-50 shadow-soft font-sans">
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

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <SearchDropdown />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link to="/admin">
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
              </div>
            ) : (
              <div className="flex items-center space-x-2">
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
          </div>
        </div>
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