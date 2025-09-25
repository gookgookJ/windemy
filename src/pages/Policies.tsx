// src/pages/Policies.jsx

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// --- 데이터 (이전과 동일) ---
const announcements = [
  { id: 1, date: "2024.03.15", title: "신규 강의 업데이트 및 할인 이벤트 안내", summary: "3월 신규 강의가 업데이트되었으며, 오픈 기념 할인 이벤트를 진행합니다.", content: `안녕하세요 윈들리아카데미입니다.\n\n3월 신규 강의가 업데이트되었으며, 오픈 기념 할인 이벤트를 진행합니다.\n\n📚 신규 강의 목록:\n• 실전 React 마스터 클래스\n• Python 데이터 분석 완주반\n• UI/UX 디자인 실무 과정\n\n🎉 할인 혜택:\n• 얼리버드 30% 할인 (선착순 100명)\n• 번들 구매 시 추가 10% 할인\n• 수강평 작성 시 다음 강의 10% 쿠폰 제공\n\n이벤트 기간: 2024.03.15 ~ 2024.03.31\n자세한 내용은 각 강의 페이지를 확인해주세요.\n\n감사합니다.` },
  { id: 2, date: "2024.03.10", title: "플랫폼 정기 점검 안내", summary: "시스템 안정성 향상을 위한 정기 점검이 진행됩니다.", content: `안녕하세요 윈들리아카데미입니다.\n\n시스템 안정성 향상 및 신규 기능 적용을 위한 정기 점검을 실시합니다.\n\n🔧 점검 일정:\n• 일시: 2024년 3월 12일(화) 02:00~06:00 (4시간)\n• 영향: 전체 서비스 일시 중단\n\n🛠️ 점검 내용:\n• 서버 안정성 개선\n• 동영상 스트리밍 품질 향상\n• 새로운 학습 진도 추적 기능 추가\n• 보안 업데이트\n\n점검 시간 동안 서비스 이용이 불가하니 양해 부탁드립니다.\n점검 완료 후 더욱 안정적인 서비스로 찾아뵙겠습니다.\n\n감사합니다.` },
];
const faqData = [
  { category: "강의 수강", items: [ { question: "강의는 언제까지 수강할 수 있나요?", answer: "구매한 강의는 평생 소장하여 언제든지 수강하실 수 있습니다. 단, 일부 라이브 강의나 특별 프로그램은 수강 기간이 제한될 수 있습니다." }, { question: "모바일에서도 강의를 들을 수 있나요?", answer: "네, 모바일 브라우저를 통해 언제 어디서든 강의를 수강하실 수 있습니다. 모바일 앱도 준비 중이니 조금만 기다려주세요." } ] },
  { category: "결제 및 환불", items: [ { question: "어떤 결제 방법을 지원하나요?", answer: "신용카드, 체크카드, 계좌이체, 카카오페이, 토스페이 등 다양한 결제 방법을 지원합니다." }, { question: "환불 정책이 어떻게 되나요?", answer: "구매 후 7일 이내, 강의 진도율 10% 미만일 경우 100% 환불이 가능합니다. 자세한 환불 정책은 이용약관을 참고해주세요." } ] }
];
const termsData = [
  { id: "terms-1", title: "제1조 (목적)", content: "이 약관은 (주)어베어가 운영하는 '윈들리아카데미' 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다." },
  { id: "terms-2", title: "제2조 (정의)", content: "• '서비스'란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.\n• '회원'이란 이 약관에 따라 서비스 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.\n• '강의'란 서비스를 통해 제공되는 교육 콘텐츠를 의미합니다." }
];
const privacyData = [
  { id: "privacy-1", title: "1. 개인정보의 처리목적", content: "(주)어베어는 다음의 목적을 위하여 개인정보를 처리합니다:\n• 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산\n• 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별 등\n• 마케팅 및 광고에의 활용" },
  { id: "privacy-2", title: "2. 개인정보의 처리 및 보유기간", content: "회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다." }
];

// --- 콘텐츠 렌더링 컴포넌트들 (UI 간소화 적용) ---

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
        <Input placeholder="공지사항 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11" />
      </div>
      <Card>
        <CardContent className="p-0">
          {filteredAnnouncements.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredAnnouncements.map((item) => (
                <AccordionItem value={item.id.toString()} key={item.id}>
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-muted/50">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3" />{item.date}</p>
                      <h3 className="font-semibold text-base">{item.title}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-2 pb-6">
                    <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground leading-relaxed">{item.content}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : ( <div className="text-center py-20 text-muted-foreground"><p>검색 결과가 없습니다.</p></div> )}
        </CardContent>
      </Card>
    </div>
  );
};

const FaqContent = () => {
  return (
    <div className="space-y-8">
      {faqData.map((category) => (
        <section key={category.category}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">{category.category}</h3>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {category.items.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="px-6 text-left font-semibold hover:bg-muted/50">{item.question}</AccordionTrigger>
                    <AccordionContent className="px-6 pb-5 text-base text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
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

// 이용약관, 개인정보처리방침 (추가 목차 네비게이션 제거)
const PolicyContent = ({ data }) => {
  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="prose prose-sm max-w-none space-y-8">
          {data.map((item) => (
            <section key={item.id}>
              <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
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
    // flex-grow를 위한 최상위 div 추가 및 푸터 문제 해결
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      {/* flex-grow를 main에 적용 */}
      <main className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex-grow">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* 좌측 사이드바 네비게이션 */}
          <aside className="lg:sticky top-24 h-fit">
            <nav className="flex lg:flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 px-3 py-5"
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              ))}
            </nav>
          </aside>
          
          {/* 우측 콘텐츠 영역 */}
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