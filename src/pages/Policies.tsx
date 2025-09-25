// src/pages/Policies.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // shadcn/ui 설치 시 포함되는 유틸리티 함수
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- 데이터 (기존과 동일) ---
const announcements = [/* ...기존 데이터와 동일... */];
const faqData = [/* ...기존 데이터와 동일... */];

// --- 이용약관 및 개인정보처리방침 데이터 구조화 ---
// 긴 텍스트를 목차와 함께 보여주기 위해 데이터를 배열 형태로 재구성합니다.
const termsData = [
  { id: "terms-1", title: "제1조 (목적)", content: "이 약관은 (주)어베어가 운영하는 '윈들리아카데미' 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다." },
  { id: "terms-2", title: "제2조 (정의)", content: "• '서비스'란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.\n• '회원'이란 이 약관에 따라 서비스 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.\n• '강의'란 서비스를 통해 제공되는 교육 콘텐츠를 의미합니다." },
  { id: "terms-3", title: "제3조 (약관의 효력 및 변경)", content: "이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 공지와 함께 효력을 발생합니다." },
];

const privacyData = [
  { id: "privacy-1", title: "1. 개인정보의 처리목적", content: "(주)어베어는 다음의 목적을 위하여 개인정보를 처리합니다:\n• 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산\n• 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별 등\n• 마케팅 및 광고에의 활용" },
  { id: "privacy-2", title: "2. 개인정보의 처리 및 보유기간", content: "회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.\n• 회원가입 및 관리: 서비스 이용계약 또는 회원가입 해지시까지\n• 전자상거래 관련: 계약·청약철회, 대금결제, 재화 등 공급기록 - 5년" },
  { id: "privacy-3", title: "3. 처리하는 개인정보의 항목", content: "• 필수항목: 이메일, 비밀번호, 이름, 휴대전화번호\n• 선택항목: 프로필 사진, 관심 분야\n• 자동 생성정보: 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보" },
];


// --- 각 탭의 콘텐츠를 별도 컴포넌트로 분리 ---

/** 공지사항 콘텐츠 */
const AnnouncementsContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="공지사항을 검색해보세요..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11"
        />
      </div>
      <Card>
        <CardContent className="p-0">
          {filteredAnnouncements.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredAnnouncements.map((item) => (
                <AccordionItem value={item.id.toString()} key={item.id}>
                  <AccordionTrigger className="px-6 text-left hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <Calendar className="h-3 w-3" /> {item.date}
                      </p>
                      <h3 className="font-semibold text-base">{item.title}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-2 pb-6">
                    <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground leading-relaxed">
                      {item.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>"{searchTerm}"에 대한 검색 결과가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/** 자주 묻는 질문 콘텐츠 */
const FaqContent = () => {
  return (
    <div className="space-y-8">
      {faqData.map((category) => (
        <section key={category.category}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {category.category}
          </h3>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {category.items.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="px-6 text-left font-semibold hover:bg-muted/50">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-5 text-base text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
};

/** 이용약관, 개인정보처리방침 콘텐츠 (목차 기능 포함) */
const PolicyContent = ({ data }) => {
  return (
    <div className="grid lg:grid-cols-[200px_1fr] gap-12">
      {/* 목차 (Table of Contents) - 화면이 작아지면 숨김 */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <h4 className="font-semibold mb-3 text-sm">목차</h4>
          <ul className="space-y-2">
            {data.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* 본문 */}
      <Card>
        <CardContent className="p-8">
          <div className="prose prose-sm max-w-none space-y-8">
            {data.map((item) => (
              <section key={item.id} id={item.id} className="scroll-mt-20">
                <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{item.content}</p>
              </section>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


// --- 메인 페이지 컴포넌트 ---
const PoliciesPage = () => {
  const [activeTab, setActiveTab] = useState('announcements');

  useEffect(() => {
    // 페이지 타이틀, 설명 등 SEO 관련 설정
    document.title = "공지사항 및 정책 | 윈들리아카데미";
    // ... (meta 태그 설정 등)
  }, []);
  
  const navItems = [
    { id: 'announcements', label: '공지사항', icon: Bell },
    { id: 'faq', label: '자주 묻는 질문', icon: HelpCircle },
    { id: 'terms', label: '이용약관', icon: FileText },
    { id: 'privacy', label: '개인정보처리방침', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'announcements':
        return <AnnouncementsContent />;
      case 'faq':
        return <FaqContent />;
      case 'terms':
        return <PolicyContent data={termsData} />;
      case 'privacy':
        return <PolicyContent data={privacyData} />;
      default:
        return null;
    }
  };
  
  const activeItem = navItems.find(item => item.id === activeTab);

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">도움말 센터</h1>
            <p className="mt-4 text-lg text-muted-foreground">윈들리아카데미의 최신 소식과 정책을 확인하세요.</p>
          </div>
          
          <div className="grid md:grid-cols-[240px_1fr] gap-10">
            {/* 좌측 사이드바 네비게이션 */}
            <aside>
              <nav className="sticky top-24 space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3 px-4 py-6"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-base">{item.label}</span>
                  </Button>
                ))}
              </nav>
            </aside>
            
            {/* 우측 콘텐츠 영역 */}
            <div className="min-w-0">
               <div className="mb-6 flex items-center gap-2">
                <activeItem.icon className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{activeItem.label}</h2>
              </div>
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PoliciesPage;