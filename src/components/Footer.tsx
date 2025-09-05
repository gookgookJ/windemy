import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const footerLinks = {
    courses: [
      { name: "개발/프로그래밍", href: "/courses/development" },
      { name: "마케팅", href: "/courses/marketing" },
      { name: "디자인", href: "/courses/design" },
      { name: "비즈니스", href: "/courses/business" },
      { name: "전체 강의", href: "/courses" },
    ],
    support: [
      { name: "공지사항", href: "/notices" },
      { name: "자주 묻는 질문", href: "/faq" },
      { name: "1:1 문의", href: "/contact" },
      { name: "환불 정책", href: "/refund" },
      { name: "이용약관", href: "/terms" },
    ],
    company: [
      { name: "회사소개", href: "/about" },
      { name: "채용정보", href: "/careers" },
      { name: "제휴문의", href: "/partnership" },
      { name: "언론보도", href: "/press" },
      { name: "투자자 정보", href: "/investors" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Youtube, href: "#", name: "YouTube" },
  ];

  return (
    <footer className="bg-foreground text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                최신 강의 소식을 받아보세요
              </h3>
              <p className="text-white/70 text-lg">
                새로운 강의 출시 알림과 특별 할인 혜택을 가장 먼저 만나보세요.
              </p>
            </div>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
              />
              <Button variant="secondary" size="lg" className="whitespace-nowrap">
                구독하기
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-2xl font-bold">LearnHub</span>
            </div>
            <p className="text-white/70 text-lg leading-relaxed mb-6">
              전문가들의 실무 경험이 담긴 고품질 온라인 교육으로 
              여러분의 꿈을 현실로 만들어드립니다.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="w-5 h-5 text-primary" />
                <span>hello@learnhub.co.kr</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Phone className="w-5 h-5 text-primary" />
                <span>1588-1234</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-5 h-5 text-primary" />
                <span>서울특별시 강남구 테헤란로 123</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">강의 카테고리</h4>
            <ul className="space-y-3">
              {footerLinks.courses.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">고객 지원</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">회사 정보</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/70 text-sm">
              © 2024 LearnHub. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/privacy" className="text-white/70 hover:text-white transition-colors">
                개인정보처리방침
              </a>
              <a href="/terms" className="text-white/70 hover:text-white transition-colors">
                이용약관
              </a>
              <a href="/business" className="text-white/70 hover:text-white transition-colors">
                사업자정보확인
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;