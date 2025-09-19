import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFavorites } from '@/contexts/FavoritesContext';

interface Course {
  id: string;
  title: string;
  short_description?: string;
  instructor_name?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  price: number;
  rating?: number;
  total_students?: number;
  duration_hours?: number;
  level?: string;
  category?: string;
  is_hot?: boolean;
  is_new?: boolean;
  created_at?: string;
}

interface SearchResult extends Course {
  relevance: number;
}

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
    fetchCategories();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name),
          categories:category_id(name, slug)
        `)
        .eq('is_published', true);

      if (error) throw error;

      // Calculate relevance scores and filter
      const results: SearchResult[] = (data || [])
        .map((course: any) => {
          const titleMatch = course.title.toLowerCase().includes(query.toLowerCase());
          const descMatch = course.short_description?.toLowerCase().includes(query.toLowerCase()) || false;
          const instructorMatch = course.profiles?.full_name?.toLowerCase().includes(query.toLowerCase()) || false;
          
          let relevance = 0;
          if (titleMatch) relevance += 15;  // 제목 매치는 높은 점수
          if (instructorMatch) relevance += 12;  // 강사 이름 매치도 높은 점수
          if (descMatch) relevance += 5;  // 설명 매치는 낮은 점수
          
          // Exact matches get higher scores
          if (course.title.toLowerCase() === query.toLowerCase()) relevance += 20;
          if (course.profiles?.full_name?.toLowerCase() === query.toLowerCase()) relevance += 18;
          
          return {
            ...course,
            instructor_name: course.profiles?.full_name || '운영진',
            category: course.categories?.name || '기타',
            thumbnail_url: course.thumbnail_url || course.thumbnail_path || '/placeholder.svg',
            relevance
          };
        })
        .filter(course => course.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching courses:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const filteredAndSortedResults = () => {
    let filtered = [...searchResults];

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.level === levelFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        filtered.sort((a, b) => b.relevance - a.relevance);
        break;
      case 'newest':
        // Assuming courses have created_at field
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.total_students || 0) - (a.total_students || 0));
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return filtered;
  };

  const results = filteredAndSortedResults();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Header */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="강의를 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg rounded-xl border-2 focus:border-primary"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg"
                >
                  검색
                </Button>
              </div>
            </form>

            {searchParams.get('q') && (
              <div className="text-center">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  '<span className="text-primary">{searchParams.get('q')}</span>'에 대한 검색결과
                </h1>
                <p className="text-muted-foreground">
                  총 <span className="font-semibold text-foreground">{results.length}</span>개의 강의를 찾았습니다
                </p>
              </div>
            )}
          </div>

          {/* Filters */}
          {results.length > 0 && (
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8 p-4 bg-card rounded-xl border">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">필터:</span>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 카테고리</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="레벨" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 레벨</SelectItem>
                    <SelectItem value="beginner">초급</SelectItem>
                    <SelectItem value="intermediate">중급</SelectItem>
                    <SelectItem value="advanced">고급</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">관련성순</SelectItem>
                  <SelectItem value="newest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                  <SelectItem value="price_low">가격 낮은순</SelectItem>
                  <SelectItem value="price_high">가격 높은순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search Results */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-muted-foreground">검색 중...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((course) => {
                const handleFavoriteClick = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(course.id);
                };

                return (
                  <Link key={course.id} to={`/course/${course.id}`} className="group cursor-pointer block">
                    <div 
                      className="relative mb-4 bg-muted/50 aspect-[16/9] lg:aspect-[16/9] overflow-hidden rounded-xl"
                      data-image-container
                    >
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          const container = img.closest('[data-image-container]') as HTMLElement;
                          // Only adjust aspect ratio for mobile/tablet (below lg breakpoint)
                          if (container && img.naturalWidth && img.naturalHeight && window.innerWidth < 1024) {
                            const aspectRatio = img.naturalWidth / img.naturalHeight;
                            container.style.aspectRatio = aspectRatio.toString();
                          }
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          requestAnimationFrame(() => {
                            target.src = "/placeholder.svg";
                          });
                        }}
                      />
                      
                      {/* Favorite Heart Button */}
                      <button
                        onClick={handleFavoriteClick}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 z-10"
                        aria-label={isFavorite(course.id) ? "관심 강의에서 제거" : "관심 강의에 추가"}
                      >
                        <Heart 
                          className={`w-4 h-4 transition-all duration-200 ${
                            isFavorite(course.id) 
                              ? 'text-red-500 fill-red-500' 
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        />
                      </button>

                      {/* Tags */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        {course.is_hot && (
                          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                            HOT
                          </span>
                        )}
                        {course.is_new && (
                          <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      
                      {course.instructor_name && 
                       course.instructor_name !== "운영진" && 
                       course.instructor_name !== "강사" && (
                        <div className="text-sm text-muted-foreground">
                          {course.instructor_name}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : searchParams.get('q') ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                검색 결과가 없습니다
              </h2>
              <p className="text-muted-foreground mb-6">
                '{searchParams.get('q')}'와 관련된 강의를 찾을 수 없습니다.<br />
                다른 키워드로 검색해보세요.
              </p>
              <Link to="/courses">
                <Button>
                  전체 강의 보기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                검색어를 입력해주세요
              </h2>
              <p className="text-muted-foreground">
                찾고 싶은 강의의 제목이나 키워드를 입력하세요.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;