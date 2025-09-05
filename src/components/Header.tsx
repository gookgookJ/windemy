import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigationItems = [
    { name: "전체 강의", href: "/courses" },
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
            <a href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">LearnHub</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {item.name}
                </a>
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
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-secondary">
                2
              </Badge>
            </Button>

            {/* User Menu */}
            {isLoggedIn ? (
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
                <Button variant="default" size="sm">
                  회원가입
                </Button>
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
                  <a
                    key={item.name}
                    href={item.href}
                    className="block text-muted-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  >
                    {item.name}
                  </a>
                ))}
              </nav>

              {/* Mobile Auth Buttons */}
              {!isLoggedIn && (
                <div className="flex space-x-3 pt-4 border-t border-border sm:hidden">
                  <Button variant="ghost" className="flex-1">
                    로그인
                  </Button>
                  <Button variant="default" className="flex-1">
                    회원가입
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