import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, X, TrendingUp, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

interface SearchDropdownProps {
  className?: string;
  onClose?: () => void;
}

export const SearchDropdown = ({ className, onClose }: SearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    recentSearches,
    recommendedCourses,
    isLoading,
    searchCourses,
    removeFromRecentSearches,
    clearRecentSearches,
    getPopularSearchTerms,
  } = useSearch();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 실시간 검색은 하지 않고, 엔터키나 버튼 클릭시에만 검색
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      searchCourses(searchQuery);
      setIsOpen(false);
    }
  };

  const popularTerms = getPopularSearchTerms();

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="강의를 검색해보세요"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 bg-muted/50 border-none rounded-xl focus:bg-white focus:shadow-medium transition-all duration-200"
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {searchQuery.trim() && searchResults.length > 0 ? (
            // Search Results
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                검색 결과 ({searchResults.length})
              </h3>
              <div className="space-y-2">
                {searchResults.slice(0, 5).map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {(course.thumbnail_url || course.thumbnail_path) && (
                        <img
                          src={course.thumbnail_url || course.thumbnail_path}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {course.short_description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {course.level || 'beginner'}
                        </Badge>
                        <span className="text-xs font-medium text-primary">
                          {course.price === 0 ? '무료' : `₩${course.price.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      최근 검색어
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      전체 삭제
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((term, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/50"
                      >
                        <button
                          className="flex-1 text-left text-sm text-foreground"
                          onClick={() => {
                            setSearchQuery(term);
                            searchCourses(term);
                            setIsOpen(false);
                          }}
                        >
                          {index + 1}. {term}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromRecentSearches(term)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Terms */}
              {popularTerms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    인기 검색어
                  </h3>
                  <div className="space-y-1">
                    {popularTerms.map((term, index) => (
                      <button
                        key={index}
                        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setSearchQuery(term);
                          searchCourses(term);
                          setIsOpen(false);
                        }}
                      >
                        <span className="text-sm text-foreground">
                          {index + 1}. {term}
                        </span>
                        <div className="text-red-500">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Courses */}
              {recommendedCourses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    추천 강의
                  </h3>
                  <div className="space-y-2">
                    {recommendedCourses.slice(0, 4).map((course) => (
                      <Link
                        key={course.id}
                        to={`/course/${course.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setIsOpen(false);
                          onClose?.();
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {(course.thumbnail_url || course.thumbnail_path) && (
                            <img
                              src={course.thumbnail_url || course.thumbnail_path}
                              alt={course.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {course.title}
                          </p>
                          <p className="text-xs text-primary font-medium">
                            {course.price === 0 ? '무료' : `₩${course.price.toLocaleString()}`}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">검색 중...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};