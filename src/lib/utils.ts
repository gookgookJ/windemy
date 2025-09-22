import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/integrations/supabase/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 기본 이미지 경로
const DEFAULT_IMAGE = '/placeholder.svg';

/**
 * 통합 이미지 URL 생성 함수
 * 모든 이미지 경로 처리를 한 곳에서 관리
 */
export const getImageUrl = (bucketName: string, path: string | null | undefined): string => {
  if (!path) {
    return DEFAULT_IMAGE;
  }

  // 이미 완전한 URL인 경우 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 상대 경로인 경우 (public 폴더)
  if (path.startsWith('/')) {
    return path;
  }

  // 'public/' 접두사가 있는 경우 제거 (레거시 데이터 호환성)
  const imageName = path.startsWith('public/') ? path.replace('public/', '') : path;

  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(imageName);
    return data?.publicUrl || DEFAULT_IMAGE;
  } catch (error) {
    console.error('Error generating public URL:', error);
    return DEFAULT_IMAGE;
  }
};