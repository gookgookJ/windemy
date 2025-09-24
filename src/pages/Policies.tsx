import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, HelpCircle, FileText, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Policies = () => {
  useEffect(() => {
    document.title = "공지사항 및 정책 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "윈들리아카데미의 공지사항, 자주 묻는 질문, 서비스 이용약관, 개인정보처리방침을 확인하세요");
  }, []);

  const announcements = [
    {
      date: "2024.03.15",
      title: "신규 강의 업데이트 및 할인 이벤트 안내",
      content: "안녕하세요 윈들리아카데미입니다. 3월 신규 강의가 업데이트되었으며, 오픈 기념 할인 이벤트를 진행합니다. 자세한 내용은 공지사항을 확인해주세요."
    },
    {
      date: "2024.03.10",
      title: "플랫폼 정기 점검 안내",
      content: "시스템 안정성 향상을 위한 정기 점검이 진행됩니다. 점검 시간: 2024년 3월 12일(화) 02:00~06:00 (4시간)"
    },
    {
      date: "2024.03.05",
      title: "개인정보처리방침 개정 안내",
      content: "개인정보보호법 개정에 따라 개인정보처리방침이 일부 변경되었습니다. 변경 사항을 확인해주시기 바랍니다."
    }
  ];

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
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">공지사항 및 정책</h1>
            <p className="text-muted-foreground">윈들리아카데미의 공지사항과 정책을 확인하세요.</p>
          </div>

          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                공지사항
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                자주 묻는 질문
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                이용약관
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                개인정보처리방침
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    공지사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.map((announcement, index) => (
                      <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-lg">{announcement.title}</h3>
                          <span className="text-sm text-muted-foreground">{announcement.date}</span>
                        </div>
                        <p className="text-muted-foreground">{announcement.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    서비스 이용약관
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <div className="space-y-6 text-sm">
                    <section>
                      <h3 className="text-lg font-semibold mb-3">제1조 (목적)</h3>
                      <p>이 약관은 (주)어베어가 운영하는 "윈들리아카데미" 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">제2조 (정의)</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>"서비스"란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.</li>
                        <li>"회원"이란 이 약관에 따라 서비스 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.</li>
                        <li>"강의"란 서비스를 통해 제공되는 교육 콘텐츠를 의미합니다.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h3>
                      <p>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 공지와 함께 효력을 발생합니다.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">제4조 (서비스의 제공 및 변경)</h3>
                      <p>회사는 다음과 같은 업무를 수행합니다:</p>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>온라인 교육 콘텐츠 제공</li>
                        <li>학습 관리 시스템 제공</li>
                        <li>수료증 발급</li>
                        <li>기타 회사가 정하는 업무</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">제5조 (서비스 이용계약의 성립)</h3>
                      <p>서비스 이용계약은 회원이 되고자 하는 자가 약관의 내용에 대하여 동의를 하고 가입신청을 한 후 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.</p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    개인정보처리방침
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <div className="space-y-6 text-sm">
                    <section>
                      <h3 className="text-lg font-semibold mb-3">1. 개인정보의 처리목적</h3>
                      <p>(주)어베어는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산</li>
                        <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지</li>
                        <li>마케팅 및 광고에의 활용: 이벤트 등 광고성 정보 전달, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">2. 개인정보의 처리 및 보유기간</h3>
                      <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>회원가입 및 관리: 서비스 이용계약 또는 회원가입 해지시까지, 다만 채권·채무관계 잔존시에는 해당 채권·채무관계 정산시까지</li>
                        <li>전자상거래에서의 계약·청약철회, 대금결제, 재화 등 공급기록: 5년</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">3. 처리하는 개인정보의 항목</h3>
                      <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>필수항목: 이메일, 비밀번호, 이름, 휴대전화번호</li>
                        <li>선택항목: 프로필 사진, 관심 분야</li>
                        <li>자동 생성정보: 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">4. 개인정보의 안전성 확보조치</h3>
                      <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                        <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                        <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3">5. 개인정보보호책임자</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <p><strong>개인정보보호책임자:</strong> 김승현</p>
                        <p><strong>연락처:</strong> 1661-4939</p>
                        <p><strong>이메일:</strong> privacy@windly.cc</p>
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policies;