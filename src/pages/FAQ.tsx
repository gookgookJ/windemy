import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import Footer from '@/components/Footer';

const FAQ = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "자주 묻는 질문 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "자주 묻는 질문과 답변을 확인하세요");
    
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const faqData = [
    {
      category: "강의 수강",
      items: [
        {
          question: "강의는 언제까지 수강할 수 있나요?",
          answer: "구매한 강의는 평생 소장하여 언제든지 수강하실 수 있습니다. 단, 일부 라이브 강의나 특별 프로그램은 수강 기간이 제한될 수 있습니다."
        },
        {
          question: "모바일에서도 강의를 들을 수 있나요?",
          answer: "네, 모바일 브라우저를 통해 언제 어디서든 강의를 수강하실 수 있습니다. 모바일 앱도 준비 중이니 조금만 기다려주세요."
        },
        {
          question: "강의 진도율은 어떻게 확인하나요?",
          answer: "마이페이지의 '내 강의실'에서 각 강의별 진도율을 확인하실 수 있습니다. 전체 강의의 80% 이상 수강 시 수료증을 발급받을 수 있습니다."
        }
      ]
    },
    {
      category: "결제 및 환불",
      items: [
        {
          question: "어떤 결제 방법을 지원하나요?",
          answer: "신용카드, 체크카드, 계좌이체, 카카오페이, 토스페이 등 다양한 결제 방법을 지원합니다."
        },
        {
          question: "환불 정책이 어떻게 되나요?",
          answer: "구매 후 7일 이내, 강의 진도율 10% 미만일 경우 100% 환불이 가능합니다. 자세한 환불 정책은 이용약관을 참고해주세요."
        },
        {
          question: "영수증 발급이 가능한가요?",
          answer: "네, 구매 내역에서 영수증을 발급받으실 수 있습니다. 사업자등록증을 보유하신 경우 세금계산서 발급도 가능합니다."
        }
      ]
    },
    {
      category: "기술 지원",
      items: [
        {
          question: "동영상이 재생되지 않아요.",
          answer: "브라우저 캐시를 삭제하거나 다른 브라우저로 접속해보세요. 문제가 계속되면 고객센터로 문의해주세요."
        },
        {
          question: "강의 자료는 어디서 다운로드하나요?",
          answer: "각 강의 페이지의 '강의 자료' 탭에서 PDF, 소스코드 등의 자료를 다운로드하실 수 있습니다."
        },
        {
          question: "계정에 로그인이 안 돼요.",
          answer: "비밀번호를 잊으셨다면 로그인 페이지에서 '비밀번호 찾기'를 이용해주세요. 계속 문제가 발생하면 고객센터로 연락주세요."
        }
      ]
    },
    {
      category: "수료증 및 혜택",
      items: [
        {
          question: "수료증은 언제 발급되나요?",
          answer: "강의 진도율 80% 이상 달성 시 자동으로 수료증이 발급됩니다. 마이페이지의 '수료증' 메뉴에서 확인하실 수 있습니다."
        },
        {
          question: "아너스 등급은 어떻게 올라가나요?",
          answer: "강의 수강 완료, 후기 작성, 추천 등의 활동에 따라 포인트가 적립되며, 일정 포인트 달성 시 등급이 상승합니다."
        },
        {
          question: "포인트는 어떻게 사용하나요?",
          answer: "적립된 포인트는 강의 구매 시 현금처럼 사용하실 수 있습니다. 1포인트 = 1원으로 계산됩니다."
        }
      ]
    }
  ];

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
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {faqData.map((category, categoryIndex) => (
                  <Card key={categoryIndex}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.items.map((item, itemIndex) => (
                          <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`}>
                            <AccordionTrigger className="text-left">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
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
