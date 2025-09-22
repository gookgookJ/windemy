import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseDetailImages } from '@/hooks/queries/useCourseDetailImages';

interface CourseDetailImagesProps {
  courseId: string;
}

export const CourseDetailImages: React.FC<CourseDetailImagesProps> = ({ courseId }) => {
  const { data: images = [], isLoading: loading, error } = useCourseDetailImages(courseId);

  if (error) {
    console.error('Error fetching detail images:', error);
  }

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

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12">
      {images.map((image) => (
        <div key={image.id} className="space-y-4">
          {image.section_title && (
            <h3 className="text-2xl font-semibold text-foreground">
              {image.section_title}
            </h3>
          )}
          
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-muted" style={{ aspectRatio: 'auto' }}>
                <img
                  src={image.image_url}
                  alt={image.section_title || image.image_name}
                  className="w-full h-full object-contain object-center"
                  loading="lazy"
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