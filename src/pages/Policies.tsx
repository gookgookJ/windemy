// src/pages/Policies.jsx

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar, Info } from 'lucide-react';

// --- 오류 해결을 위한 임시 컴포넌트 ---
const Header = () => (
  <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
    <div className="w-full max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">윈들리 아카데미</h1>
      <Button variant="outline" size="sm">로그인</Button>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-100 dark:bg-gray-900 border-t">
    <div className="w-full max-w-6xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
      <p>&copy; {new Date().getFullYear()} (주) 어베어. All Rights Reserved.</p>
    </div>
  </footer>
);


// --- 데이터 ---

// [요청사항 반영] 공지사항 데이터를 빈 배열로 수정
const announcements = [];

// [요청사항 반영] FAQ 데이터 보강
const faqData = [
  { 
    category: "강의 수강", 
    items: [ 
      { question: "강의는 언제까지 수강할 수 있나요?", answer: "구매한 강의는 별도의 기간이 명시되지 않은 경우 평생 소장하여 언제든지 수강하실 수 있습니다. 단, 일부 라이브 강의나 특별 프로그램은 수강 기간이 제한될 수 있습니다." }, 
      { question: "모바일에서도 강의를 들을 수 있나요?", answer: "네, 모바일 브라우저를 통해 언제 어디서든 강의를 수강하실 수 있습니다. 현재 더 나은 학습 경험을 위한 모바일 앱도 준비 중입니다." },
      { question: "강의 자료(PDF, 소스코드 등)는 어디서 받을 수 있나요?", answer: "각 강의 페이지 내 '강의 자료' 탭에서 다운로드하실 수 있습니다. 자료는 수강 기간 동안 무제한으로 이용 가능합니다." },
      { question: "강의를 듣다가 모르는 점이 생기면 어떻게 질문하나요?", answer: "각 강의별로 운영되는 질의응답 커뮤니티(슬랙, 디스코드 등)를 통해 질문을 남겨주시면, 강사님이나 조교님들이 답변해 드립니다. 커뮤니티 링크는 강의실 페이지에서 확인하실 수 있습니다." }
    ] 
  },
  { 
    category: "결제 및 환불", 
    items: [ 
      { question: "어떤 결제 방법을 지원하나요?", answer: "신용카드, 체크카드, 계좌이체, 카카오페이, 토스페이 등 다양한 결제 방법을 지원합니다." }, 
      { question: "환불 정책은 어떻게 되나요?", answer: "자세한 환불 정책은 '이용약관' 제13조 (환불 규정)을 참고해주시기 바랍니다. 온라인 강의, 오프라인 교육 등 서비스 형태에 따라 규정이 다르니 꼼꼼히 확인해주세요." },
      { question: "카드 할부 결제도 가능한가요?", answer: "네, 5만원 이상 결제 시 카드사별 무이자 할부 혜택을 받으실 수 있습니다. 결제 페이지에서 카드사를 선택하면 적용 가능한 할부 개월 수를 확인하실 수 있습니다." }
    ] 
  },
  {
    category: "기타 문의",
    items: [
      { question: "다른 수강생들과 소통할 수 있는 커뮤니티가 있나요?", answer: "네, 윈들리 아카데미는 모든 수강생이 참여할 수 있는 온라인 커뮤니티를 운영하고 있습니다. 스터디 그룹을 만들거나, 프로젝트에 대한 의견을 나누고, 유용한 정보를 공유하며 함께 성장하는 공간입니다." },
      { question: "수료 후 취업이나 이직에 대한 지원도 받을 수 있나요?", answer: "일부 전문 과정(부트캠프 등)에서는 이력서 첨삭, 모의 면접, 채용 연계 등 커리어 지원 서비스를 제공합니다. 과정별 상세 페이지에서 커리어 지원 여부를 확인해주세요." },
      { question: "강의를 다 들으면 수료증이 발급되나요?", answer: "네, 각 강의의 진도율을 80% 이상 달성하시면 '마이페이지'에서 수료증을 직접 발급받으실 수 있습니다." }
    ]
  }
];

// --- 이용약관 및 개인정보처리방침 데이터 (수정하지 않음) ---
const termsData = [ { id: "terms-1", title: "제1조 (목적)", content: "이 약관은 (주)어베어가 운영하는 '윈들리아카데미' 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다." }, { id: "terms-2", title: "제2조 (정의)", content: "• '서비스'란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.\n• '회원'이란 이 약관에 따라 서비스 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.\n• '강의'란 서비스를 통해 제공되는 교육 콘텐츠를 의미합니다." } ];
const privacyData = [ { id: "privacy-1", title: "1. 개인정보의 처리목적", content: "(주)어베어는 다음의 목적을 위하여 개인정보를 처리합니다:\n• 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산\n• 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별 등" }, { id: "privacy-2", title: "2. 개인정보의 처리 및 보유기간", content: "회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다." } ];


// --- 콘텐츠 렌더링 컴포넌트들 ---

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
          ) : ( 
            <div className="text-center py-24 text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <Info className="h-10 w-10 text-gray-400" />
              <p className="text-base">등록된 공지사항이 없습니다.</p>
            </div> 
          )}
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

const PolicyContent = ({ title, data }) => {
  return (
      <Card>
          <CardContent className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-8">{title}</h1>
              <div className="prose prose-sm md:prose-base max-w-none space-y-8 dark:prose-invert">
                  {data.map((item) => (
                      <section key={item.id}>
                          {item.title && <h3 className="font-semibold text-base md:text-lg">{item.title}</h3>}
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
      case 'terms': return <PolicyContent title="서비스 이용약관" data={termsData} />;
      case 'privacy': return <PolicyContent title="개인정보처리방침" data={privacyData} />;
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

