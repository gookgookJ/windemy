import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Formatted content component to handle markdown-like formatting
const FormattedContent = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const sections = content.split('\n\n');
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        if (section.includes('|') && section.split('|').length > 2) {
          const lines = section.split('\n');
          const tableLines = lines.filter(line => 
            line.includes('|') && 
            !line.includes(':---') && 
            !line.includes(':-') &&
            line.trim() !== ''
          );
          
          if (tableLines.length > 0) {
            return (
              <div key={index} className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-border rounded-lg">
                  <tbody>
                    {tableLines.map((line, lineIndex) => {
                      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                      return (
                        <tr key={lineIndex}>
                          {cells.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-border px-4 py-3 bg-muted/30">
                              <span className="text-base">{cell}</span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }
        
        if (section.match(/^\s*[0-9]+\./m)) {
          const lines = section.split('\n');
          return (
            <div key={index} className="space-y-3">
              {lines.map((line, lineIndex) => {
                if (line.match(/^\s*[0-9]+\./)) {
                  const number = line.match(/^\s*([0-9]+)\./)?.[1];
                  const content = line.replace(/^\s*[0-9]+\.\s*/, '');
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      {number}. {formatInlineContent(content)}
                    </p>
                  );
                } else if (line.trim()) {
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      {formatInlineContent(line)}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        
        if (section.match(/^\s*[-•]/m)) {
          const lines = section.split('\n');
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lineIndex) => {
                if (line.match(/^\s*[-•]/)) {
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      • {formatInlineContent(line.replace(/^\s*[-•]\s*/, ''))}
                    </p>
                  );
                } else if (line.trim()) {
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      {formatInlineContent(line)}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        
        return (
          <div key={index} className="space-y-3">
            {section.split('\n').map((line, lineIndex) => (
              line.trim() ? (
                <p key={lineIndex} className="leading-relaxed text-base">
                  {formatInlineContent(line)}
                </p>
              ) : null
            ))}
          </div>
        );
      })}
    </div>
  );
};

const formatInlineContent = (text: string) => {
  if (!text) return text;
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};

// Announcements content from database
const AnnouncementsContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['public-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredAnnouncements = announcements?.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">공지사항</h1>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="공지사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {isLoading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : !filteredAnnouncements || filteredAnnouncements.length === 0 ? (
          <p className="text-muted-foreground">등록된 공지사항이 없습니다</p>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="border-l-4 border-primary">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">
                        {announcement.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <time>{new Date(announcement.created_at).toLocaleDateString('ko-KR')}</time>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// FAQ content (static)
const FaqContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const faqData = [
    { category: "강의 수강", items: [ { question: "강의는 언제까지 수강할 수 있나요?", answer: "구매한 강의는 평생 소장하여 언제든지 수강하실 수 있습니다. 단, 일부 라이브 강의나 특별 프로그램은 수강 기간이 제한될 수 있습니다." }, { question: "모바일에서도 강의를 들을 수 있나요?", answer: "네, 모바일 브라우저를 통해 언제 어디서든 강의를 수강하실 수 있습니다. 모바일 앱도 준비 중이니 조금만 기다려주세요." } ] },
    { category: "결제 및 환불", items: [ { question: "어떤 결제 방법을 지원하나요?", answer: "신용카드, 체크카드, 계좌이체, 카카오페이, 토스페이 등 다양한 결제 방법을 지원합니다." }, { question: "환불 정책이 어떻게 되나요?", answer: "구매 후 7일 이내, 강의 진도율 10% 미만일 경우 100% 환불이 가능합니다. 자세한 환불 정책은 이용약관을 참고해주세요." } ] }
  ];

  const filteredFaq = faqData.map((cat) => ({
    ...cat,
    items: cat.items.filter((faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">자주 묻는 질문</h1>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="FAQ 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {filteredFaq.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <h3 className="font-semibold text-lg mb-2">{cat.category}</h3>
              {cat.items.map((faq, idx) => (
                <AccordionItem key={`${cat.category}-${idx}`} value={`${cat.category}-${idx}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </div>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

// Legal documents content from database
const PolicyContent = ({ type, title }: { type: 'terms' | 'privacy'; title: string }) => {
  const { data: document, isLoading } = useQuery({
    queryKey: [`legal-document-${type}`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type', type)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
          {document?.title || title}
        </h1>
        {document && (
          <div className="text-sm text-muted-foreground mb-8">
            버전: {document.version} | 시행일: {new Date(document.effective_date).toLocaleDateString('ko-KR')}
          </div>
        )}
        {isLoading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : !document ? (
          <p className="text-muted-foreground">문서를 찾을 수 없습니다</p>
        ) : (
          <div className="text-muted-foreground leading-relaxed">
            <FormattedContent content={document.content} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main page component
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
      case 'terms': return <PolicyContent type="terms" title="서비스 이용약관" />;
      case 'privacy': return <PolicyContent type="privacy" title="개인정보처리방침" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex-grow">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 md:gap-10">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="flex flex-row lg:flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3 px-3 h-12 lg:h-auto lg:py-3 text-sm md:text-base whitespace-nowrap"
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