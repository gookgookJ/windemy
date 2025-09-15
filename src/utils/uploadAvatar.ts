import { supabase } from '@/integrations/supabase/client';

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  // 파일 형식 검증
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }

  // 파일 크기 검증 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB 이하여야 합니다.');
  }

  // 파일명 생성
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // 기존 파일 삭제 (선택사항)
  try {
    await supabase.storage
      .from('avatars')
      .remove([fileName]);
  } catch (error) {
    // 기존 파일이 없을 수 있으므로 에러 무시
  }

  // 새 파일 업로드
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }

  // 공개 URL 반환
  const { data: publicUrl } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
};