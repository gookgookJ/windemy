import React, { useState, useEffect } from 'react';
import { ThumbsUp, BarChart, Target, Edit, Shield, Settings, Users, Layers, SquareCheck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const About = () => {
    // 기존의 모든 애니메이션 로직은 변경 없이 그대로 유지합니다.
    const [currentText, setCurrentText] = useState('');
    const [currentParticle, setCurrentParticle] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const phrases = [
        { text: "'이기는 전략'", particle: "은" },
        { text: "'성공 설계도'", particle: "는" },
        { text: "'수익화 시스템'", particle: "은" }
    ];

    useEffect(() => {
        const current = phrases[phraseIndex];
        let speed = isDeleting ? 60 : 120;
        if (!isDeleting && charIndex === current.text.length) {
            setCurrentParticle(current.particle);
            speed = 2000;
        }
        const timer = setTimeout(() => {
            if (isDeleting) {
                if (charIndex > 0) {
                    setCurrentText(current.text.substring(0, charIndex - 1));
                    setCharIndex(charIndex - 1);
                } else {
                    setIsDeleting(false);
                    setCurrentParticle('');
                    setPhraseIndex((prev) => (prev + 1) % phrases.length);
                }
            } else {
                if (charIndex < current.text.length) {
                    setCurrentText(current.text.substring(0, charIndex + 1));
                    setCharIndex(charIndex + 1);
                } else {
                    setIsDeleting(true);
                }
            }
        }, speed);
        return () => clearTimeout(timer);
    }, [phraseIndex, charIndex, isDeleting, phrases]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const els = document.querySelectorAll('[data-animate]');
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    (e.target as HTMLElement).classList.add('opacity-100', 'translate-y-0');
                }
            });
        }, { threshold: 0.1 });
        els.forEach(el => io.observe(el));
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const els = document.querySelectorAll('[data-count]');
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement & { dataset: DOMStringMap };
                    if (el.dataset.animated === 'true') return;
                    el.dataset.animated = 'true';
                    const target = parseInt(el.dataset.count || '0', 10);
                    const start = performance.now();
                    const duration = 2000;
                    const step = (now: number) => {
                        const p = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        el.textContent = Math.floor(eased * target).toLocaleString();
                        if (p < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                }
            });
        }, { threshold: 0.5 });
        els.forEach(el => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Header />

            {/* Hero Section */}
            <section
                className="relative overflow-hidden border-b border-border bg-white pt-24 pb-20 lg:pt-[76px] lg:pb-[140px] -mt-16 opacity-0 translate-y-8 transition-all duration-700"
                data-animate
            >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Cpath d='M25 50h50 M50 25v50' stroke='%23e1e4ed' stroke-width='0.5' fill='none'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E\")" }} />
                </div>
                <div className="max-w-6xl mx-auto px-5 text-left">
                    <h2 className="text-base text-primary font-bold tracking-wider mb-4">WINDLY ACADEMY</h2>
                    <h1 className="text-4xl lg:text-6xl font-extrabold lg:leading-tight">
                        성공의 지름길은 없습니다.
                        <br />
                        그러나 <span className="text-primary">{currentText}</span>
                        <span className="pl-1">{currentParticle}</span> 존재합니다.
                    </h1>
                    <div className="max-w-2xl">
                        <p className="mt-8 text-base md:text-lg text-muted-foreground leading-relaxed md:leading-loose">
                            윈들리아카데미는 가장 확실한 성공의 길을 안내합니다.
                            <br className="hidden md:block" />
                            당신의 잠재력을 수익으로 바꾸는 여정, 지금 바로 시작하세요.
                        </p>
                    </div>
                </div>
            </section>

            {/* By The Numbers Section */}
            <section className="px-5 py-20 lg:py-[120px]" data-animate>
                <div className="max-w-6xl mx-auto text-left">
                    <h2 className="text-base text-primary font-bold tracking-wider mb-3">BY THE NUMBERS</h2>
                    <p className="text-3xl lg:text-5xl font-extrabold text-foreground leading-tight mb-6">
                        숫자가 증명하는 윈들리아카데미의 가치
                    </p>
                    <div className="mt-12 lg:mt-[60px] grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-[30px]">
                        {[
                            { label: '콘텐츠 만족도', value: 98, icon: ThumbsUp },
                            { label: '수강 후 평균 수익 증가율', value: 350, icon: BarChart },
                            { label: '수강생 목표 달성률', value: 92, icon: Target }
                        ].map((stat) => (
                            <div key={stat.label} className="bg-card border border-border rounded-2xl p-8 group hover:border-primary hover:shadow-xl hover:-translate-y-2 transition-all duration-300" data-animate>
                                {/* ✨ FIX: `break-keep` 클래스를 추가하여 단어 단위로 줄바꿈되도록 수정 */}
                                <p className="text-lg font-semibold text-muted-foreground mb-3 group-hover:text-primary/80 transition-colors duration-300 break-keep">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    <div className="font-extrabold text-foreground text-5xl lg:text-[52px]">
                                        <span data-count={stat.value}>0</span>%
                                    </div>
                                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                        <stat.icon className="w-7 h-7 text-primary" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Principles Section */}
            <section className="px-5 py-20 lg:py-[120px] bg-gray-50/70">
                <div className="max-w-6xl mx-auto">
                    <div className="text-left mb-12 lg:mb-[60px]" data-animate>
                        <h2 className="text-base text-primary font-bold tracking-wider mb-3">OUR PRINCIPLES</h2>
                        <p className="text-3xl lg:text-5xl font-extrabold leading-tight">
                            우리가 이기는 결과를 만드는
                            <br />
                            <span className="text-primary">6가지 핵심 원칙</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-[30px]">
                        {[
                           { title: '결과 중심 교육', desc: '수강생의 실제 수익 창출을 최우선 목표로, 모든 커리큘럼은 즉시 실행 가능한 액션 플랜 중심으로 구성됩니다.', icon: Edit },
                           { title: '검증된 전문가', desc: '해당 분야에서 직접 압도적인 성과를 낸 강사만이 무대에 오릅니다. 이론가가 아닌 실전가의 생생한 노하우를 전수합니다.', icon: Shield },
                           { title: '자동화 시스템 구축', desc: "단발성 수익을 넘어, 지속 가능한 현금 흐름을 만드는 '나만의 자동화 시스템' 구축법을 알려드립니다.", icon: Settings },
                           { title: '독보적 커뮤니티', desc: '성공을 향한 여정은 혼자일 수 없습니다. 같은 목표를 가진 동료들과 교류하며 함께 성장하는 강력한 커뮤니티를 제공합니다.', icon: Users },
                           { title: '최신 트렌드 반영', desc: '시장은 끊임없이 변합니다. 윈들리아카데미는 가장 최신의 시장 트렌드와 플랫폼 로직을 분석하여 즉시 적용 가능한 전략을 제시합니다.', icon: Layers },
                           { title: '스파르타식 관리', desc: '의지가 약해도 괜찮습니다. 1:1 맞춤 피드백과 체계적인 관리 시스템으로 포기하지 않고 목표를 달성하도록 돕습니다.', icon: SquareCheck },
                        ].map((principle) => (
                            <div key={principle.title} className="bg-card border border-border rounded-3xl p-8 group hover:border-primary hover:shadow-xl hover:-translate-y-2 transition-all duration-300" data-animate>
                                <div className="flex items-center justify-center w-[60px] h-[60px] bg-primary/10 mb-6 rounded-2xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                    <principle.icon className="w-[30px] h-[30px] text-primary" />
                                </div>
                                <h4 className="text-xl lg:text-[22px] font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">{principle.title}</h4>
                                <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{principle.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="px-5 pb-20 lg:pb-[120px]">
                <div className="max-w-6xl mx-auto" data-animate>
                    {/* ✨ FIX: 모바일에서 세로 정렬 시 텍스트가 중앙에 오도록 `text-center` 추가 */}
                    <div className="bg-primary text-primary-foreground rounded-[30px] p-8 lg:py-20 lg:px-[60px] flex flex-col md:flex-row md:items-center md:justify-between text-center md:text-left hover:shadow-2xl transition-shadow duration-300">
                        <div className="mb-8 md:mb-0">
                            <h2 className="text-3xl md:text-4xl font-bold leading-snug mb-3">이제 당신의 차례입니다.</h2>
                            <p className="text-base md:text-lg opacity-80">
                                윈들리아카데미와 함께라면, 
                                {/* ✨ FIX: 작은 화면(sm 미만)에서 자연스러운 줄바꿈 추가 */}
                                <br className="block sm:hidden" />
                                경제적 자유는 더 이상 꿈이 아닙니다.
                            </p>
                        </div>
                        <a
                            href="/courses"
                            className="inline-flex items-center justify-center gap-2 bg-background text-foreground font-bold py-4 px-8 rounded-full hover:bg-muted hover:scale-105 transition-all duration-200 hover:-translate-y-1 flex-shrink-0 group self-center md:self-auto"
                        >
                            <span>모든 클래스 둘러보기</span>
                            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </a>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default React.memo(About);