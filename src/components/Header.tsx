import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();

  const navigationItems = [
    { name: "전체 강의", href: "/courses" },
    { name: "샘플 강의", href: "/course/550e8400-e29b-41d4-a716-446655440000" },
    { name: "개발/프로그래밍", href: "/courses/development" },
    { name: "마케팅", href: "/courses/marketing" },
    { name: "디자인", href: "/courses/design" },
    { name: "비즈니스", href: "/courses/business" },
  ];

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold text-foreground">Windly Academy</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="강의를 검색해보세요"
                className="pl-10 bg-muted/50 border-none rounded-xl focus:bg-white focus:shadow-medium transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Badge variant="destructive" className="text-xs">관리자</Badge>
                  </Link>
                )}
                <Link to="/my-page">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="default" size="sm">
                    회원가입
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Search */}
              <div className="md:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="강의를 검색해보세요"
                    className="pl-10 bg-muted/50 border-none rounded-xl"
                  />
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="space-y-3">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link to="/cart" className="block text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-2">
                  장바구니
                </Link>
                {user && (
                  <Link to="/my-page" className="block text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-2">
                    마이페이지
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="block text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-2">
                    관리자
                  </Link>
                )}
              </nav>

              {/* Mobile Auth Buttons */}
              {!user ? (
                <div className="flex space-x-3 pt-4 border-t border-border sm:hidden">
                  <Link to="/auth" className="flex-1">
                    <Button variant="ghost" className="w-full">
                      로그인
                    </Button>
                  </Link>
                  <Link to="/auth" className="flex-1">
                    <Button variant="default" className="w-full">
                      회원가입
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-border sm:hidden">
                  <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;