import heroLms from '@/assets/hero-lms.jpg';

const HeroSection = () => {
  return (
    <div
      className="relative bg-cover bg-center h-96"
      style={{ backgroundImage: `url(${heroLms})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white">
        <h1 className="text-4xl font-bold">배움의 다음 단계를 경험하세요</h1>
        <p className="mt-4 text-lg">최고의 전문가들이 만든 다양한 강의를 만나보세요.</p>
      </div>
    </div>
  );
};

export default HeroSection;