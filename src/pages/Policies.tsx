import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { defaultAnnouncements, defaultFaqs, defaultTermsData, defaultPrivacyData } from '@/data/policyData';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  content: string;
  order_index: number;
}

const FormattedContent = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const sections = content.split('\n\n');
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        // Handle numbered lists
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
                      {number}. {content}
                    </p>
                  );
                } else if (line.trim()) {
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      {line}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        
        // Handle bulleted lists
        if (section.match(/^\s*[-•]/m)) {
          const lines = section.split('\n');
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lineIndex) => {
                if (line.match(/^\s*[-•]/)) {
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      • {line.replace(/^\s*[-•]\s*/, '')}
                    </p>
                  );
                } else if (line.trim()) {
                  return (
                    <p key={lineIndex} className="leading-relaxed text-base">
                      {line}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        
        // Regular paragraphs
        return (
          <div key={index} className="space-y-3">
            {section.split('\n').map((line, lineIndex) => (
              line.trim() ? (
                <p key={lineIndex} className="leading-relaxed text-base">
                  {line}
                </p>
              ) : null
            ))}
          </div>
        );
      })}
    </div>
  );
};

const PoliciesPage = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'faq' | 'terms' | 'privacy'>('announcements');
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [termsDocuments, setTermsDocuments] = useState<LegalDocument[]>([]);
  const [privacyDocuments, setPrivacyDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [announcementsRes, faqsRes, legalDocsRes] = await Promise.all([
        supabase.from('announcements').select('*').eq('is_published', true).order('published_at', { ascending: false }),
        supabase.from('faqs').select('*').eq('is_published', true).order('category').order('order_index'),
        supabase.from('legal_documents').select('*').eq('is_published', true).order('order_index')
      ]);

      if (announcementsRes.error) throw announcementsRes.error;
      if (faqsRes.error) throw faqsRes.error;
      if (legalDocsRes.error) throw legalDocsRes.error;

      // DB 데이터와 기본 데이터 병합
      const dbAnnouncements = announcementsRes.data || [];
      const dbFaqs = faqsRes.data || [];
      const dbLegalDocs = legalDocsRes.data || [];
      
      // DB에 데이터가 없으면 기본 데이터 사용
      setAnnouncements(dbAnnouncements.length > 0 ? dbAnnouncements : defaultAnnouncements as any);
      setFaqs(dbFaqs.length > 0 ? dbFaqs : defaultFaqs as any);
      
      const terms = dbLegalDocs.filter(doc => doc.document_type === 'terms');
      const privacy = dbLegalDocs.filter(doc => doc.document_type === 'privacy');
      
      setTermsDocuments(terms.length > 0 ? terms : defaultTermsData as any);
      setPrivacyDocuments(privacy.length > 0 ? privacy : defaultPrivacyData as any);
    } catch (error) {
      console.error('Error fetching data:', error);
      // 에러 발생시 기본 데이터 사용
      setAnnouncements(defaultAnnouncements as any);
      setFaqs(defaultFaqs as any);
      setTermsDocuments(defaultTermsData as any);
      setPrivacyDocuments(defaultPrivacyData as any);
    } finally {
      setLoading(false);
    }
  };

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const filteredFaqs = Object.entries(groupedFaqs).reduce((acc, [category, items]) => {
    const filtered = items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, FAQ[]>);

  const tabs = [
    { id: 'announcements' as const, label: '공지사항', icon: Bell, color: 'text-blue-500' },
    { id: 'faq' as const, label: '자주 묻는 질문', icon: HelpCircle, color: 'text-green-500' },
    { id: 'terms' as const, label: '이용약관', icon: FileText, color: 'text-purple-500' },
    { id: 'privacy' as const, label: '개인정보처리방침', icon: Shield, color: 'text-red-500' },
  ];

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>로딩 중...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">고객 지원 센터</h1>
          <p className="text-muted-foreground text-lg">궁금하신 사항을 확인해보세요</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className={`h-6 w-6 ${activeTab === tab.id ? '' : tab.color}`} />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-6 w-6" />
              <h2 className="text-2xl font-bold">공지사항</h2>
            </div>
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">등록된 공지사항이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {new Date(announcement.published_at).toLocaleDateString('ko-KR')}
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <FormattedContent content={announcement.content} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6" />
                <h2 className="text-2xl font-bold">자주 묻는 질문</h2>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="질문을 검색해보세요..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {Object.keys(filteredFaqs).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 FAQ가 없습니다.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(filteredFaqs).map(([category, items]) => (
                <Card key={category}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">{category}</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {items.map((faq, index) => (
                        <AccordionItem key={faq.id} value={`${category}-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-6 w-6" />
              <h2 className="text-2xl font-bold">이용약관</h2>
            </div>
            {termsDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">등록된 이용약관이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-8">
                  {termsDocuments.map((doc) => (
                    <div key={doc.id}>
                      <h3 className="text-lg font-semibold mb-4">{doc.title}</h3>
                      <div className="prose prose-sm max-w-none">
                        <FormattedContent content={doc.content} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-6 w-6" />
              <h2 className="text-2xl font-bold">개인정보처리방침</h2>
            </div>
            {privacyDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">등록된 개인정보처리방침이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-8">
                  {privacyDocuments.map((doc) => (
                    <div key={doc.id}>
                      <h3 className="text-lg font-semibold mb-4">{doc.title}</h3>
                      <div className="prose prose-sm max-w-none">
                        <FormattedContent content={doc.content} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PoliciesPage;
