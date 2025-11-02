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

// Data types
interface Announcement {
  id: string;
  title: string;
  content: string;
  published_date: string;
  order_index: number;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
}

interface PolicyDocument {
  id: string;
  document_type: 'terms' | 'privacy';
  section_id: string;
  title: string;
  content: string;
  order_index: number;
}

// Content components
const AnnouncementsContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast.error('공지사항을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="공지사항 검색..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10 h-12 text-base" 
        />
      </div>
      <Card>
        <CardContent className="p-0">
          {filteredAnnouncements.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredAnnouncements.map((item) => (
                <AccordionItem value={item.id} key={item.id}>
                  <AccordionTrigger className="px-4 md:px-6 py-4 text-left hover:bg-muted/50">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.published_date).toLocaleDateString('ko-KR')}
                      </p>
                      <h3 className="font-semibold text-base md:text-lg">{item.title}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 md:px-6 pt-2 pb-6">
                    <div className="prose prose-sm md:prose-base max-w-none whitespace-pre-line text-muted-foreground leading-relaxed dark:prose-invert">
                      {item.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-24 text-muted-foreground">
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const FaqContent = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setFaqs(data || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        toast.error('FAQ를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="space-y-10">
      {Object.entries(groupedFaqs).map(([category, items]) => (
        <section key={category}>
          <h3 className="text-lg md:text-xl font-bold mb-4">{category}</h3>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {items.map((item, index) => (
                  <AccordionItem value={`item-${item.id}`} key={item.id}>
                    <AccordionTrigger className="px-4 md:px-6 text-left font-semibold text-base hover:bg-muted/50">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 md:px-6 pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">
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

const PolicyContent = ({ title, documentType }: { title: string; documentType: 'terms' | 'privacy' }) => {
  const [policyData, setPolicyData] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const { data, error } = await supabase
          .from('policy_documents')
          .select('*')
          .eq('document_type', documentType)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setPolicyData((data || []) as PolicyDocument[]);
      } catch (error) {
        console.error('Error fetching policy data:', error);
        toast.error('정책 문서를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicyData();
  }, [documentType]);

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-foreground">{title}</h1>
        <div className="space-y-8">
          {policyData.map((item) => (
            <section key={item.id} className="space-y-4">
              {item.title && (
                <h3 className={`font-bold text-foreground ${
                  item.title.includes('장') ? 'text-2xl' : 'text-lg'
                }`}>
                  {item.title}
                </h3>
              )}
              {item.content && (
                <div className="text-muted-foreground leading-relaxed">
                  <FormattedContent content={item.content} />
                </div>
              )}
            </section>
          ))}
        </div>
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
      case 'terms': return <PolicyContent title="서비스 이용약관" documentType="terms" />;
      case 'privacy': return <PolicyContent title="개인정보처리방침" documentType="privacy" />;
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
