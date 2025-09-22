import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분간 데이터를 최신으로 간주
      staleTime: 5 * 60 * 1000,
      // 10분간 캐시 유지
      gcTime: 10 * 60 * 1000,
      // 에러 발생 시 재시도 설정
      retry: (failureCount, error: any) => {
        // 네트워크 에러는 3번까지 재시도
        if (error?.message?.includes('fetch') || error?.name === 'NetworkError') {
          return failureCount < 3;
        }
        // 다른 에러는 1번만 재시도
        return failureCount < 1;
      },
      // 재시도 간격 (2초, 4초, 8초)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 윈도우 포커스 시 리프레시 비활성화 (사용자 경험 개선)
      refetchOnWindowFocus: false,
      // 네트워크 재연결 시 리프레시
      refetchOnReconnect: true,
    },
    mutations: {
      // 뮤테이션 재시도 설정
      retry: 1,
      // 뮤테이션 재시도 간격
      retryDelay: 1000,
    },
  },
});