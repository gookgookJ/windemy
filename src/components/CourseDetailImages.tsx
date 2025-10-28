import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DetailImage {
  id: string;
  image_url: string;
  image_name: string;
  section_title: string;
  order_index: number;
}

interface CourseDetailImagesProps {
  courseId: string;
}

export const CourseDetailImages: React.FC<CourseDetailImagesProps> = ({ courseId }) => {
  const [images, setImages] = useState<DetailImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailImages();
  }, [courseId]);

  const fetchDetailImages = async () => {
    try {
      const { data, error } = await supabase
        .from('course_detail_images')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching detail images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {images.map((image) => (
        <div key={image.id} className="space-y-2">
          {image.section_title && (
            <h3 className="text-2xl font-semibold text-foreground">
              {image.section_title}
            </h3>
          )}
          
          <Card className="overflow-hidden rounded-none">
            <CardContent className="p-0">
              <div className="relative bg-muted" style={{ aspectRatio: 'auto' }}>
                <img
                  src={image.image_url}
                  alt={image.section_title || image.image_name}
                  className="w-full h-full object-contain object-center"
                  onLoad={(e) => {
                    // Set container aspect ratio based on actual image dimensions
                    const img = e.target as HTMLImageElement;
                    const container = img.parentElement;
                    if (container && img.naturalWidth && img.naturalHeight) {
                      const aspectRatio = img.naturalWidth / img.naturalHeight;
                      container.style.aspectRatio = aspectRatio.toString();
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};