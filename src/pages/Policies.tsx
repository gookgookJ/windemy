// src/pages/Policies.jsx

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, FileText, Shield, Search, Calendar, Info } from 'lucide-react';

// --- 오류 해결을 위한 임시 컴포넌트 ---
// The Header and Footer components are defined here to resolve the import error.
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
      <p className="mt-2">서울특별시 강남구 | support@windly.cc</p>
    </div>
  </footer>
);


// --- 데이터 ---

// 오늘 날짜를 YYYY년 MM월 DD일 형식으로 생성
const today = new Date('2025-09-25T11:08:00+09:00');
const formattedDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`;

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

// --- 이용약관 데이터 ---
const termsData = [
    { id: "terms-intro", title: "제1장 총칙", content: "" },
    { id: "terms-1", title: "제1조 (목적)", content: "이 약관은 (주) 어베어(이하 '회사')이 운영하는 윈들리 아카데미(Windly Academy) 및 관련 플랫폼(이하 '서비스')에서 제공하는 교육 콘텐츠 및 제반 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다." },
    { id: "terms-2", title: "제2조 (정의)", content: "이 약관에서 사용하는 용어의 정의는 다음과 같습니다.\n1. '서비스': 회사가 이용자에게 온라인 동영상 강의(VOD), 실시간 라이브 강의, 오프라인 교육, 1:1 코칭/컨설팅, 전자책, 기타 교육 자료 등(이하 '콘텐츠')을 제공하는 제반 서비스를 의미합니다.\n2. '회원': 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.\n3. '유료 서비스': 회원이 회사에 일정 금액을 지불하고 이용하는 콘텐츠 및 서비스를 의미합니다.\n4. '수강 기간': 회원이 유료 서비스를 이용할 수 있도록 허용된 기간을 의미합니다." },
    { id: "terms-3", title: "제3조 (약관 등의 명시와 설명 및 개정)", content: "① 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.\n② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.\n③ 회사가 약관을 개정할 경우에는 적용일자 7일 이전부터 공지합니다. 다만, 이용자에게 불리하게 약관내용을 변경하는 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다." },
    { id: "terms-chapter2", title: "제2장 회원가입 및 관리", content: "" },
    { id: "terms-4", title: "제4조 (회원가입 및 이용계약 체결)", content: "① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의함으로써 회원가입을 신청합니다.\n② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.\n   1. 가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우\n   2. 등록 내용에 허위, 기재누락, 오기가 있거나 타인의 명의를 이용한 경우\n   3. 만 14세 미만의 아동인 경우\n   4. 기타 회사의 정책에 위배되거나 서비스 제공이 곤란하다고 판단되는 경우" },
    { id: "terms-5", title: "제5조 (회원 정보의 관리)", content: "① 회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.\n② 회원은 회원가입신청 시 기재한 사항이 변경되었을 경우 이를 회사에 알려야 하며, 변경사항을 알리지 않아 발생한 불이익에 대하여 회사는 책임지지 않습니다." },
    { id: "terms-chapter3", title: "제3장 서비스 이용", content: "" },
    { id: "terms-6", title: "제6조 (서비스의 제공)", content: "① 회사는 회원에게 다음과 같은 서비스를 제공합니다.\n   1. 온라인 동영상 강의(VOD)\n   2. 실시간 라이브 강의\n   3. 오프라인 교육 및 세미나\n   4. 1:1 코칭 또는 컨설팅\n   5. 전자책, PDF 등 자료 제공\n   6. 기타 회사가 정하는 업무\n② 회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다." },
    { id: "terms-7", title: "제7조 (유료 서비스 이용 및 결제)", content: "① 회원은 회사가 제공하는 결제수단(토스페이먼츠 등)을 통해 유료 서비스 이용 요금을 결제하여야 합니다.\n② 이용계약은 회원이 이용요금을 결제하고, 회사가 결제 확인 및 수강 승인을 완료한 시점에 성립합니다." },
    { id: "terms-8", title: "제8조 (수강 기간 및 이용 조건)", content: "① 온라인 동영상 강의(VOD)의 기본 수강 기간은 결제일로부터 6개월로 합니다. 단, 개별 콘텐츠의 특성에 따라 수강 기간이 다르게 설정될 수 있으며, 이 경우 구매 페이지에 별도로 고지합니다.\n② 오프라인 교육, 실시간 라이브 강의는 지정된 일시 및 장소에서 제공됩니다.\n③ 회원은 제공받은 강의 자료(교안, 템플릿 등)를 본인의 학습 목적으로만 사용하여야 합니다." },
    { id: "terms-chapter4", title: "제4장 의무와 책임, 지식재산권", content: "" },
    { id: "terms-9", title: "제9조 (회사의 의무)", content: "① 회사는 법령과 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하기 위하여 최선을 다하여야 합니다.\n② 회사는 회원이 안전하게 서비스를 이용할 수 있도록 보안 시스템을 갖추어야 하며, 개인정보처리방침을 공시하고 준수합니다." },
    { id: "terms-10", title: "제10조 (회원의 의무 및 이용 제한)", content: "① 회원의 아이디와 비밀번호에 관한 관리책임은 회원에게 있습니다.\n② 회원은 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항 등을 준수하여야 하며, 다음 행위를 하여서는 안 됩니다.\n   1. 신청 또는 변경 시 허위내용의 등록\n   2. 타인의 정보도용\n   3. 회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위\n   4. 기타 불법적이거나 부당한 행위" },
    { id: "terms-11", title: "제11조 (지식재산권 보호 및 계정 공유 금지)", content: "① 회사가 제공하는 모든 콘텐츠(강의 영상, 교안, 템플릿, 전자책 등)에 대한 저작권 및 지식 재산권은 회사 또는 해당 콘텐츠를 제공한 강사에게 있습니다.\n② 회원은 회사의 사전 승인 없이 콘텐츠를 복제, 녹화, 배포, 전송, 출판, 방송하거나 2차적 저작물로 가공할 수 없으며, 제3자에게 양도, 대여, 판매할 수 없습니다.\n③ 회원은 하나의 계정(ID)을 본인만 사용하여야 하며, 타인과 공유하여 서비스를 이용해서는 안 됩니다 (계정 공유 금지).\n④ 회원이 본 조를 위반한 사실(무단 복제, 배포, 2차 가공, 계정 공유 등)이 확인될 경우, 회사는 즉시 해당 회원의 서비스 이용을 정지하고 이용계약을 해지할 수 있습니다. 이 경우 유료서비스 이용료는 환불되지 않으며, 회사는 이로 인해 발생한 손해에 대해 민형사상의 법적 책임을 물을 수 있습니다." },
    { id: "terms-chapter5", title: "제5장 청약철회 및 환불", content: "" },
    { id: "terms-12", title: "제12조 (청약철회 등)", content: "① 회사와 유료 서비스 이용에 관한 계약을 체결한 회원은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 계약 체결일로부터 7일 이내에는 청약의 철회를 할 수 있습니다.\n② 단, 다음 각 호의 어느 하나에 해당하는 경우에는 청약철회 등이 제한됩니다.\n   1. 회원이 콘텐츠를 사용 또는 일부 소비하여 그 가치가 현저히 낮아진 경우 (예: 온라인 강의 수강 시작)\n   2. 복제가 가능한 재화 등의 포장을 훼손한 경우 (예: 전자책, 강의 자료 다운로드)" },
    { id: "terms-13", title: "제13조 (환불 규정)", content: "회사는 회원이 유료 서비스 이용 계약을 해지하거나 청약철회를 하는 경우, 다음의 환불 규정에 따라 환불을 진행합니다. 환불 금액은 할인 등이 적용된 실 결제액을 기준으로 산정됩니다.\n\n**1. 온라인 동영상 강의(VOD)**\n가. 결제일로부터 7일 이내이며, 콘텐츠를 전혀 이용하지 않은 경우(강의 시청 기록 없음, 자료 다운로드 이력 없음): 전액 환불\n나. 콘텐츠 이용을 시작하였거나 결제일로부터 7일이 경과한 경우, 아래 기준(수강 기간 기준)에 따라 환불합니다.\n   - 총 수강 기간의 1/3 경과 전: 실 결제액의 2/3 환불\n   - 총 수강 기간의 1/2 경과 전: 실 결제액의 1/2 환불\n   - 총 수강 기간의 1/2 경과 후: 환불 불가\n다. 단, 강의 진도율이 50%를 초과한 경우, 남은 수강 기간과 관계없이 환불이 불가할 수 있습니다.\n라. 강의 자료(교안, 템플릿 등)를 다운로드 받은 경우, 콘텐츠를 이용한 것으로 간주하여 위 기준에 따라 처리됩니다.\n\n**2. 오프라인 교육 및 세미나 (기수제 등)**\n가. 수강 시작일은 개강일 기준으로 산정되며, 환불 금액 산정은 회원의 출석 여부와 관계없이 실제 수업이 진행된 회차를 기준으로 합니다.\n나. 강의 시작 1일 전까지 통보 시: 전액 환불\n다. 강의 개강 후 (총 수업 회차를 기준으로 산정):\n   - 총 수업 회차의 1/3 경과 전: 수강료의 2/3 환불\n   - 총 수업 회차의 1/2 경과 전: 수강료의 1/2 환불\n   - 총 수업 회차의 1/2 경과 후: 환불 불가\n라. 기수제 오프라인 교육의 특성상 단순 변심에 의한 당일 환불은 불가할 수 있습니다.\n\n**3. 실시간 라이브 강의**\n가. 강의 시작 1일 전까지 통보 시: 전액 환불\n나. 다회차로 구성된 경우, 오프라인 교육 규정(제13조 2항)에 준하여 환불합니다.\n다. 1회성 강의의 경우 강의 시작 당일 취소 또는 불참 시 환불이 불가합니다.\n\n**4. 1:1 코칭 및 컨설팅**\n가. 서비스 시작 전: 전액 환불\n나. 서비스 시작 후: 총 계약 금액에서 이미 진행된 세션 횟수(또는 시간)에 비례하는 금액 및 위약금(총 계약 금액의 10% 이내)을 공제한 후 환불합니다.\n\n**5. 전자책, PDF 등 자료 제공형 콘텐츠**\n가. 콘텐츠의 특성상 다운로드 또는 열람이 시작된 이후에는 복제가 가능하므로 환불이 불가합니다.\n\n**6. 특별 프로모션 (예: 목표 달성 시 전액 환불 보장형 강의)**\n특별한 조건이 부여된 프로모션 상품의 경우, 별도의 환불 규정이 우선 적용됩니다. '목표 매출 미달성 시 전액 환불 보장형' 프로모션은 아래 조건을 **모두 충족**한 회원에 한해 적용되며, 이는 결제 시 동의한 사항으로 간주됩니다.\n가. 강의 100% 출석 (지각 및 조퇴 포함 시 미충족 처리)\n나. 모든 과제 및 미션 100% 제출 (기한 내 미제출 시 환불 대상 제외)\n다. 수강 종료 후, 매주 사업 활동 인증자료 제출 (사업 활동은 강의에서 제안된 방식에 기반하여 실행)\n라. 본 보장형 환불은 실제 활동 기반의 성실한 참여를 전제로 합니다." },
    { id: "terms-chapter6", title: "제6장 기타", content: "" },
    { id: "terms-14", title: "제14조 (면책 조항 및 책임 제한)", content: "① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.\n② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.\n③ **(교육 내용에 대한 면책)** 회사가 제공하는 교육 콘텐츠는 이커머스 운영에 대한 정보 제공 및 역량 강화를 목적으로 하며, 특정 수준의 매출이나 사업 성과를 보장하지 않습니다.\n④ 회원은 강의 내용을 기반으로 한 사업 운영 및 투자 결정에 대한 책임이 전적으로 본인에게 있음을 인지하며, 그 결과(매출 증감, 손익 등)에 대해 회사는 책임을 지지 않습니다." },
    { id: "terms-15", title: "제15조 (준거법 및 재판관할)", content: "① 회사와 회원 간 제기된 소송은 대한민국법을 준거법으로 합니다.\n② 회사와 회원 간 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원(또는 회사 소재지 관할 법원)에 제소합니다." },
    { id: "terms-date", title: "", content: `- 공고일자: ${formattedDate}\n- 시행일자: ${formattedDate}` }
];

// --- 개인정보처리방침 데이터 ---
const privacyData = [
    { id: "privacy-intro", title: "", content: "(주) 어베어 (이하 '회사')은 윈들리 아카데미 서비스(이하 ‘서비스’) 이용자의 개인정보보호를 매우 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 회사는 본 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다." },
    { id: "privacy-1", title: "제1조 (개인정보의 수집 항목 및 이용 목적)", content: "회사는 회원가입, 원활한 고객 상담, 교육 서비스 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.\n\n1. **회원가입 및 서비스 이용**\n   - **필수 항목:** 이름, 이메일 주소(ID), 휴대전화번호, 비밀번호\n   - **이용 목적:** 회원 식별 및 가입 의사 확인, 만 14세 미만 아동 가입 제한, 서비스 이용 및 강의 수강료 결제, 고객 문의 응대(채널톡 등), 공지사항 전달\n\n2. **교육 서비스 제공 및 학습 관리**\n   - **수집 항목:** 강의 진도율, 학습 이력, 결제 내역\n   - **이용 목적:** 강의 콘텐츠 제공(VOD, 라이브, 오프라인, 코칭 등), 학습 진도 관리 및 독려, 맞춤형 강의 추천\n\n3. **마케팅 및 광고에의 활용 (선택 동의 시)**\n   - **수집 항목:** 이름, 이메일 주소, 휴대전화번호, 서비스 이용 기록\n   - **이용 목적:** 신규 강의 및 이벤트 정보 안내(SMS, 이메일, 알림톡 등), 프로모션 제공\n\n4. **서비스 이용과정에서 자동 생성 정보**\n   - **수집 항목:** 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보, 기기 정보(OS 버전 등)\n   - **이용 목적:** 서비스 이용 통계 분석, 서비스 품질 개선, 부정 이용 방지" },
    { id: "privacy-2", title: "제2조 (개인정보의 보유 및 이용 기간)", content: "회사는 법령에 따른 개인정보 보유·이용 기간 또는 이용자로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.\n1. **회원 정보:** 원칙적으로 회원 탈퇴 시 지체없이 파기합니다.\n2. 단, 관계 법령의 규정에 따라 보존할 필요가 있는 경우 회사는 해당 법령에서 정한 기간 동안 정보를 보관합니다.\n   - 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)\n   - 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)\n   - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)\n   - 웹사이트 방문기록(통신사실확인자료): 3개월 (통신비밀보호법)" },
    { id: "privacy-3", title: "제3조 (개인정보의 제3자 제공)", content: "회사는 이용자의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 이용자의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다. 회사는 현재 개인정보를 제3자에게 제공하고 있지 않습니다." },
    { id: "privacy-4", title: "제4조 (개인정보 처리의 위탁)", content: "① 회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 외부 전문 업체에 위탁하고 있습니다.\n\n| 수탁업체 | 위탁업무 내용 |\n| :--- | :--- |\n| (주)비바리퍼블리카 (토스페이먼츠) | 강의 수강료 결제 처리 및 정산 |\n| (주)채널코퍼레이션 (채널톡) | 고객 상담 및 문의 응대 시스템 제공 |\n| (주)카카오 | 카카오톡 알림톡(정보성/광고성 메시지) 발송 |\n| 클라우드 서버 업체 | 서비스 제공을 위한 서버 운영 및 데이터 보관 |\n\n② 회사는 위탁계약 체결 시 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다." },
    { id: "privacy-5", title: "제5조 (개인정보의 파기 절차 및 방법)", content: "① 회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.\n② 법령에 따라 보존해야 하는 경우에는 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.\n③ 전자적 파일 형태는 기록을 재생할 수 없도록 기술적인 방법을 이용하여 삭제하며, 종이 문서는 분쇄기로 분쇄하거나 소각하여 파기합니다." },
    { id: "privacy-6", title: "제6조 (이용자의 권리·의무 및 행사방법)", content: "① 이용자는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.\n② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.\n③ 회사는 만 14세 미만 아동의 회원가입을 받지 않으며 개인정보를 수집하지 않습니다." },
    { id: "privacy-7", title: "제7조 (개인정보의 안전성 확보 조치)", content: "회사는 개인정보의 안전성 확보를 위해 다음과 같은 관리적, 기술적, 물리적 조치를 취하고 있습니다. (내부관리계획 수립·시행, 접근권한 관리, 개인정보의 암호화, 보안프로그램 설치 등)" },
    { id: "privacy-8", title: "제8조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)", content: "① 회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.\n② 이용자는 웹 브라우저의 옵션 설정(예: 웹 브라우저 상단의 도구 > 인터넷 옵션 > 개인정보 메뉴)을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다." },
    { id: "privacy-9", title: "제9조 (개인정보 보호책임자)", content: "회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n- **개인정보 보호책임자**\n  - 성명: 김승현\n  - 직책: 대표\n  - 이메일: support@windly.cc" },
    { id: "privacy-10", title: "제10조 (개인정보처리방침의 변경)", content: `본 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.\n\n- 공고일자: ${formattedDate}\n- 시행일자: ${formattedDate}` }
];

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

