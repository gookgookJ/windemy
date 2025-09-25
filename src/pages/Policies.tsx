// src/pages/Policies.jsx

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- 데이터 (이전과 동일) ---
const announcements = [
  { id: 1, date: "2024.03.15", title: "신규 강의 업데이트 및 할인 이벤트 안내", content: `안녕하세요 윈들리아카데미입니다.\n\n3월 신규 강의가 업데이트되었으며, 오픈 기념 할인 이벤트를 진행합니다.\n\n📚 신규 강의 목록:\n• 실전 React 마스터 클래스\n• Python 데이터 분석 완주반\n• UI/UX 디자인 실무 과정` },
  { id: 2, date: "2024.03.10", title: "플랫폼 정기 점검 안내", content: `안녕하세요 윈들리아카데미입니다.\n\n시스템 안정성 향상 및 신규 기능 적용을 위한 정기 점검을 실시합니다.\n\n🔧 점검 일정:\n• 일시: 2024년 3월 12일(화) 02:00~06:00 (4시간)` },
];
const faqData = [
  { category: "강의 수강", items: [ { question: "강의는 언제까지 수강할 수 있나요?", answer: "구매한 강의는 평생 소장하여 언제든지 수강하실 수 있습니다. 단, 일부 라이브 강의나 특별 프로그램은 수강 기간이 제한될 수 있습니다." }, { question: "모바일에서도 강의를 들을 수 있나요?", answer: "네, 모바일 브라우저를 통해 언제 어디서든 강의를 수강하실 수 있습니다. 모바일 앱도 준비 중이니 조금만 기다려주세요." } ] },
  { category: "결제 및 환불", items: [ { question: "어떤 결제 방법을 지원하나요?", answer: "신용카드, 체크카드, 계좌이체, 카카오페이, 토스페이 등 다양한 결제 방법을 지원합니다." }, { question: "환불 정책이 어떻게 되나요?", answer: "구매 후 7일 이내, 강의 진도율 10% 미만일 경우 100% 환불이 가능합니다. 자세한 환불 정책은 이용약관을 참고해주세요." } ] }
];
const termsData = [ { id: "terms-1", title: "제1조 (목적)", content: "이 약관은 (주)어베어가 운영하는 '윈들리아카데미' 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다." }, { id: "terms-2", title: "제2조 (정의)", content: "• '서비스'란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.\n• '회원'이란 이 약관에 따라 서비스 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.\n• '강의'란 서비스를 통해 제공되는 교육 콘텐츠를 의미합니다." } ];
const privacyData = [ { id: "privacy-1", title: "1. 개인정보의 처리목적", content: "(주)어베어는 다음의 목적을 위하여 개인정보를 처리합니다:\n• 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산\n• 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별 등" }, { id: "privacy-2", title: "2. 개인정보의 처리 및 보유기간", content: "회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다." } ];


// --- 콘텐츠 렌더링 컴포넌트들 (폰트, 굵기 조정) ---

const AnnouncementsContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredAnnouncements = announcements.filter(ann => ann.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="공지사항 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 text-base" />
      </div>
      <Card>
        <CardContent className="p-0">
          {filteredAnnouncements.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredAnnouncements.map((item) => (
                <AccordionItem value={item.id.toString()} key={item.id}>
                  <AccordionTrigger className="px-4 md:px-6 py-4 text-left hover:bg-muted/50">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{item.date}</p>
                      <h3 className="font-semibold text-base md:text-lg">{item.title}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 md:px-6 pt-2 pb-6">
                    <div className="prose prose-sm md:prose-base max-w-none whitespace-pre-line text-muted-foreground leading-relaxed dark:prose-invert">{item.content}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : ( <div className="text-center py-24 text-muted-foreground"><p>검색 결과가 없습니다.</p></div> )}
        </CardContent>
      </Card>
    </div>
  );
};

const FaqContent = () => {
  return (
    <div className="space-y-10">
      {faqData.map((category) => (
        <section key={category.category}>
          <h3 className="text-lg md:text-xl font-bold mb-4">{category.category}</h3>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {category.items.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="px-4 md:px-6 text-left font-semibold text-base hover:bg-muted/50">{item.question}</AccordionTrigger>
                    <AccordionContent className="px-4 md:px-6 pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
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

const PolicyContent = ({ data }) => {
  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="prose prose-sm md:prose-base max-w-none space-y-8 dark:prose-invert">
          {data.map((item) => (
            <section key={item.id}>
              <h3 className="font-semibold text-base md:text-lg">{item.title}</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{item.content}</p>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- 메인 페이지 컴포넌트 ---
const PoliciesPage = () => {
  const [activeTab, setActiveTab] = useState('announcements');
  const navItems = [
    { id: 'announcements', label: '공지사항', icon: Bell },
    { id: 'faq', label: '자주 묻는 질문', icon: HelpCircle },
    { id: 'terms', label: '이용약관', icon: FileText },
    { id: 'privacy', label: '개인정보처리방침', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'announcements': return <AnnouncementsContent />;
      case 'faq': return <FaqContent />;
      case 'terms': return <PolicyContent data={termsData} />;
      case 'privacy': return <PolicyContent data={privacyData} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex-grow">
        <div className="grid lg:grid-cols-[220px_1fr] gap-6 md:gap-10">
          <aside className="lg:sticky top-24 h-fit">
            <nav className="flex flex-row lg:flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 px-3 h-12 lg:h-auto lg:py-3 text-sm md:text-base"
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              ))}
            </nav>
          </aside>
          <div className="min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PoliciesPage;