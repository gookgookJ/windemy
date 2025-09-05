import { 
  Building2, 
  TrendingUp, 
  BarChart3, 
  GraduationCap, 
  Calculator,
  Users,
  BookOpen,
  Star,
  Trophy
} from "lucide-react";

const CategorySection = () => {
  const categories = [
    { icon: Building2, label: "내집마련", color: "bg-blue-100 text-blue-600" },
    { icon: TrendingUp, label: "오리지널", color: "bg-green-100 text-green-600" },
    { icon: BarChart3, label: "미국주식", color: "bg-red-100 text-red-600" },
    { icon: GraduationCap, label: "직업전문", color: "bg-purple-100 text-purple-600" },
    { icon: Calculator, label: "창구매학과", color: "bg-orange-100 text-orange-600" },
    { icon: Users, label: "네모꼴", color: "bg-cyan-100 text-cyan-600" },
    { icon: BookOpen, label: "무제한업", color: "bg-pink-100 text-pink-600" },
    { icon: Star, label: "이달의강의", color: "bg-yellow-100 text-yellow-600" },
    { icon: Trophy, label: "전문가실전", color: "bg-indigo-100 text-indigo-600" },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-6">
          {categories.map((category, index) => (
            <div key={index} className="flex flex-col items-center group cursor-pointer">
              <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200`}>
                <category.icon className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium text-foreground text-center">
                {category.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;