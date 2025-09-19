import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Menu, X, LogOut, BookOpen, Users, Info, ShoppingCart, Bell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { SearchDropdown } from "@/components/SearchDropdown";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  const { user, profile, signOut, isAdmin } = useAuth();

  const navigationItems = [
    { 
      name: "전체강의", 
      href: "/courses",
      icon: BookOpen,
      submenu: [
        { name: "전체", href: "/courses" },
        { name: "무료강의", href: "/courses/free-courses" },
        { name: "VOD 강의", href: "/courses/vod-courses" },
        { name: "프리미엄 강의", href: "/courses/premium-courses" },
      ]
    },
    { 
      name: "강사신청", 
      href: "/instructor-apply", 
      icon: Users,
      badge: "NEW"
    },
    { 
      name: "소개", 
      href: "/about", 
      icon: Info 
    },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border/50 fixed top-0 left-0 right-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0 select-none mr-8">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg leading-none">윈</span>
              </div>
              <span className="text-xl font-bold text-foreground whitespace-nowrap hidden sm:block">윈들리아카데미</span>
            </Link>

            {/* Desktop Navigation - 아이콘과 함께 */}
            <nav className="hidden lg:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.name} className="relative group">
                    {item.submenu ? (
                      <>
                        <button className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary/5">
                          <IconComponent className="w-4 h-4" />
                          {item.name}
                          <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="py-2">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-primary/5 transition-colors duration-200"
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
                        className="text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium py-2 px-3 rounded-lg hover:bg-primary/5 flex items-center gap-2 relative"
                      >
                        <IconComponent className="w-4 h-4" />
                        {item.name}
                        {item.badge && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 ml-1">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Search Bar - 더 크고 중앙에 배치 */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
            <div className="w-full relative">
              <SearchDropdown />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search */}
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/10 rounded-full">
              <Search className="w-5 h-5" />
            </Button>

            {/* 즐겨찾기 및 알림 (로그인 시에만) */}
            {user && (
              <>
                <Link to="/favorite-courses">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full relative">
                    <Heart className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
                </Button>
              </>
            )}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="destructive" size="sm" className="text-xs font-medium px-3 py-1.5 rounded-full">
                      관리자
                    </Button>
                  </Link>
                )}
                <Link to="/my-page">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-destructive/10 rounded-full">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="font-medium hover:bg-primary/10 px-4 py-2"
                  onClick={() => {
                    setAuthModalTab('signin');
                    setIsAuthModalOpen(true);
                  }}
                >
                  로그인
                </Button>
                <Button 
                  size="sm"
                  className="font-medium px-4 py-2 rounded-full bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setIsAuthModalOpen(true);
                  }}
                >
                  회원가입
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-primary/10 rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-6 space-y-5">
              {/* Mobile Search */}
              <div className="md:hidden">
                <SearchDropdown />
              </div>

              {/* Mobile Navigation */}
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.name}>
                      <Link
                        to={item.href}
                        className="flex items-center gap-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 transition-colors duration-200 font-medium py-3 px-3 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <IconComponent className="w-5 h-5" />
                        {item.name}
                        {item.badge && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                      {item.submenu && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className="block text-sm text-foreground/60 hover:text-foreground hover:bg-primary/5 transition-colors duration-200 py-2 px-3 rounded-lg"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {user && (
                  <>
                    <Link 
                      to="/favorite-courses" 
                      className="flex items-center gap-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 transition-colors duration-200 font-medium py-3 px-3 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5" />
                      관심강의
                    </Link>
                    <Link 
                      to="/my-page" 
                      className="flex items-center gap-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 transition-colors duration-200 font-medium py-3 px-3 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      마이페이지
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 transition-colors duration-200 font-medium py-3 px-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    관리자
                  </Link>
                )}
              </nav>

              {/* Mobile Auth Buttons */}
              {!user ? (
                <div className="flex space-x-3 pt-4 border-t border-border/30 sm:hidden">
                  <Button 
                    variant="ghost" 
                    className="flex-1 font-medium hover:bg-primary/10"
                    onClick={() => {
                      setAuthModalTab('signin');
                      setIsAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    로그인
                  </Button>
                  <Button 
                    className="flex-1 font-medium rounded-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setAuthModalTab('signup');
                      setIsAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    회원가입
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border/30 sm:hidden">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start font-medium hover:bg-destructive/10 rounded-lg" 
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </Button>
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