import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Policies = () => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = "공지사항 및 정책 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "윈들리아카데미의 공지사항, 자주 묻는 질문, 서비스 이용약관, 개인정보처리방침을 확인하세요");
  }, []);

  const announcements = [
    {
      id: 1,
      date: "2024.03.15",
      title: "신규 강의 업데이트 및 할인 이벤트 안내",
      summary: "3월 신규 강의가 업데이트되었으며, 오픈 기념 할인 이벤트를 진행합니다.",
      content: `안녕하세요 윈들리아카데미입니다.
      
3월 신규 강의가 업데이트되었으며, 오픈 기념 할인 이벤트를 진행합니다.

📚 신규 강의 목록:
• 실전 React 마스터 클래스
• Python 데이터 분석 완주반  
• UI/UX 디자인 실무 과정

🎉 할인 혜택:
• 얼리버드 30% 할인 (선착순 100명)
• 번들 구매 시 추가 10% 할인
• 수강평 작성 시 다음 강의 10% 쿠폰 제공

이벤트 기간: 2024.03.15 ~ 2024.03.31
자세한 내용은 각 강의 페이지를 확인해주세요.

감사합니다.`
    },
    {
      id: 2,
      date: "2024.03.10", 
      title: "플랫폼 정기 점검 안내",
      summary: "시스템 안정성 향상을 위한 정기 점검이 진행됩니다.",
      content: `안녕하세요 윈들리아카데미입니다.

시스템 안정성 향상 및 신규 기능 적용을 위한 정기 점검을 실시합니다.

🔧 점검 일정:
• 일시: 2024년 3월 12일(화) 02:00~06:00 (4시간)
• 영향: 전체 서비스 일시 중단

🛠️ 점검 내용:
• 서버 안정성 개선
• 동영상 스트리밍 품질 향상
• 새로운 학습 진도 추적 기능 추가
• 보안 업데이트

점검 시간 동안 서비스 이용이 불가하니 양해 부탁드립니다.
점검 완료 후 더욱 안정적인 서비스로 찾아뵙겠습니다.

감사합니다.`
    },
    {
      id: 3,
      date: "2024.03.05",
      title: "개인정보처리방침 개정 안내", 
      summary: "개인정보보호법 개정에 따라 개인정보처리방침이 일부 변경되었습니다.",
      content: `안녕하세요 윈들리아카데미입니다.

개인정보보호법 개정에 따라 개인정보처리방침이 일부 변경되었습니다.

📋 주요 변경 사항:
• 개인정보 수집 목적 명시 강화
• 제3자 제공 관련 동의 절차 개선  
• 개인정보 보유기간 명확화
• 이용자 권리 행사 방법 상세화

📅 시행일: 2024년 3월 10일

변경된 개인정보처리방침은 본 공지사항 하단의 '개인정보처리방침' 탭에서 확인하실 수 있습니다.

궁금한 사항이 있으시면 고객센터로 문의해주세요.

감사합니다.`
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

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-3">공지사항 및 정책</h1>
            <p className="text-muted-foreground">윈들리아카데미의 최신 소식과 정책을 확인하세요</p>
          </div>

          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="announcements" className="flex items-center gap-2 py-3">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">공지사항</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2 py-3">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">자주 묻는 질문</span>
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">이용약관</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 py-3">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">개인정보처리방침</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="space-y-6">
              {/* 검색 기능 */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="공지사항을 검색해보세요..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 공지사항 목록 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-primary" />
                    공지사항
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      총 {filteredAnnouncements.length}건
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>검색 결과가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredAnnouncements.map((announcement) => (
                        <Dialog key={announcement.id}>
                          <DialogTrigger asChild>
                            <div className="p-6 hover:bg-muted/50 cursor-pointer transition-colors group">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                                    {announcement.title}
                                  </h3>
                                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                    {announcement.summary}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {announcement.date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      자세히 보기
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl mb-2">
                                {announcement.title}
                              </DialogTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Calendar className="h-4 w-4" />
                                {announcement.date}
                              </div>
                            </DialogHeader>
                            <div className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-line text-sm leading-relaxed">
                                {announcement.content}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2">자주 묻는 질문</h2>
                <p className="text-muted-foreground">궁금한 점을 빠르게 해결해보세요</p>
              </div>
              
              {faqData.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="border-0 shadow-sm">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {category.items.map((item, itemIndex) => (
                        <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`} className="border-b last:border-b-0">
                          <AccordionTrigger className="text-left px-6 py-4 hover:bg-muted/50 transition-colors">
                            <span className="font-medium">{item.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
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
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-6 w-6 text-primary" />
                    서비스 이용약관
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    윈들리아카데미 서비스 이용에 관한 약관입니다.
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="prose prose-sm max-w-none space-y-8">
                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">제1조 (목적)</h3>
                      <p className="leading-relaxed">이 약관은 (주)어베어가 운영하는 "윈들리아카데미" 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">제2조 (정의)</h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            <div>
                              <strong>"서비스"</strong>란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            <div>
                              <strong>"회원"</strong>이란 이 약관에 따라 서비스 이용계약을 체결하고 서비스를 이용하는 자를 의미합니다.
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            <div>
                              <strong>"강의"</strong>란 서비스를 통해 제공되는 교육 콘텐츠를 의미합니다.
                            </div>
                          </li>
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">제3조 (약관의 효력 및 변경)</h3>
                      <p className="leading-relaxed">이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 공지와 함께 효력을 발생합니다.</p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">제4조 (서비스의 제공 및 변경)</h3>
                      <p className="leading-relaxed mb-4">회사는 다음과 같은 업무를 수행합니다:</p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <ul className="space-y-2">
                          <li className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                            온라인 교육 콘텐츠 제공
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                            학습 관리 시스템 제공
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                            수료증 발급
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></span>
                            기타 회사가 정하는 업무
                          </li>
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">제5조 (서비스 이용계약의 성립)</h3>
                      <p className="leading-relaxed">서비스 이용계약은 회원이 되고자 하는 자가 약관의 내용에 대하여 동의를 하고 가입신청을 한 후 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.</p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shield className="h-6 w-6 text-primary" />
                    개인정보처리방침
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    개인정보보호법에 따른 개인정보 처리방침입니다.
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="prose prose-sm max-w-none space-y-8">
                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">1. 개인정보의 처리목적</h3>
                      <p className="leading-relaxed mb-4">(주)어베어는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            마케팅 및 광고에의 활용: 이벤트 등 광고성 정보 전달, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계
                          </li>
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">2. 개인정보의 처리 및 보유기간</h3>
                      <p className="leading-relaxed mb-4">회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            <div>
                              <strong>회원가입 및 관리:</strong> 서비스 이용계약 또는 회원가입 해지시까지, 다만 채권·채무관계 잔존시에는 해당 채권·채무관계 정산시까지
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            <div>
                              <strong>전자상거래 관련:</strong> 계약·청약철회, 대금결제, 재화 등 공급기록 - 5년
                            </div>
                          </li>
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">3. 처리하는 개인정보의 항목</h3>
                      <p className="leading-relaxed mb-4">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">필수항목</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• 이메일</li>
                            <li>• 비밀번호</li>
                            <li>• 이름</li>
                            <li>• 휴대전화번호</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">선택항목</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• 프로필 사진</li>
                            <li>• 관심 분야</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">자동 생성정보</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• 서비스 이용기록</li>
                            <li>• 접속 로그</li>
                            <li>• 쿠키</li>
                            <li>• 접속 IP 정보</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">4. 개인정보의 안전성 확보조치</h3>
                      <p className="leading-relaxed mb-4">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">관리적 조치</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• 내부관리계획 수립·시행</li>
                            <li>• 정기적 직원 교육</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">기술적 조치</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• 접근권한 관리</li>
                            <li>• 접근통제시스템</li>
                            <li>• 암호화</li>
                            <li>• 보안프로그램 설치</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-primary">물리적 조치</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• 전산실 접근통제</li>
                            <li>• 자료보관실 통제</li>
                          </ul>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-4 text-primary">5. 개인정보보호책임자</h3>
                      <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong className="text-primary">개인정보보호책임자</strong>
                            <p className="mt-1">김승현</p>
                          </div>
                          <div>
                            <strong className="text-primary">연락처</strong>
                            <p className="mt-1">1661-4939</p>
                          </div>
                          <div>
                            <strong className="text-primary">이메일</strong>
                            <p className="mt-1">privacy@windly.cc</p>
                          </div>
                        </div>
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