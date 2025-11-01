import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = "자주 묻는 질문 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "자주 묻는 질문과 답변을 확인하세요");
    
    if (!user) {
      navigate('/');
    }
    
    fetchFaqs();
  }, [user, navigate]);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('order_index');

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('FAQ를 불러오는데 실패했습니다.');
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

  if (loading) {
    return (
      <div className="bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>로딩 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">자주 묻는 질문</h1>
                <p className="text-muted-foreground">궁금한 점을 빠르게 해결해보세요.</p>
              </div>

              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="질문을 검색해보세요..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {Object.keys(filteredFaqs).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 FAQ가 없습니다.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(filteredFaqs).map(([category, items]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5" />
                          {category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;