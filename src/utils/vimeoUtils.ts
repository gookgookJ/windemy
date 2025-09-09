interface VimeoVideoInfo {
  duration: number;
  title: string;
  thumbnail_url: string;
  width: number;
  height: number;
}

export const extractVimeoId = (url: string): string | null => {
  if (!url) return null;
  
  // Vimeo URL patterns
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[\w-]+\/(\d+)/,
    /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/,
    /vimeo\.com\/album\/\d+\/video\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export const getVimeoVideoInfo = async (videoUrl: string): Promise<VimeoVideoInfo | null> => {
  try {
    const videoId = extractVimeoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid Vimeo URL');
    }

    // Vimeo oEmbed API를 사용 (인증 불필요)
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=640&height=360`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await response.json();
    
    // duration은 oEmbed에서 직접 제공되지 않으므로 Vimeo API를 사용
    const vimeoApiUrl = `https://vimeo.com/api/v2/video/${videoId}.json`;
    const apiResponse = await fetch(vimeoApiUrl);
    
    if (!apiResponse.ok) {
      throw new Error('Failed to fetch video duration');
    }
    
    const apiData = await apiResponse.json();
    const videoData = apiData[0];

    return {
      duration: Math.round(videoData.duration / 60), // 초를 분으로 변환
      title: data.title || videoData.title,
      thumbnail_url: data.thumbnail_url || videoData.thumbnail_large,
      width: data.width || videoData.width,
      height: data.height || videoData.height
    };
  } catch (error) {
    console.error('Error fetching Vimeo video info:', error);
    return null;
  }
};

export const isValidVimeoUrl = (url: string): boolean => {
  return extractVimeoId(url) !== null;
};