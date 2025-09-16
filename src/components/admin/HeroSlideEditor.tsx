import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  course_id?: string;
  link_url?: string;
  link_type: 'course' | 'external' | 'none';
  order_index: number;
  is_active: boolean;
  background_color?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

interface Course {
  id: string;
  title: string;
}

const HeroSlideEditor = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch slides and courses
  useEffect(() => {
    fetchSlides();
    fetchCourses();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('order_index');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch slides",
          variant: "destructive",
        });
        return;
      }

      setSlides((data as HeroSlide[]) || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Create new slide
  const createSlide = () => {
    const newSlide: HeroSlide = {
      id: 'new',
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      link_type: 'none',
      order_index: slides.length,
      is_active: true,
      background_color: 'from-blue-400 to-blue-600',
    };
    setEditingSlide(newSlide);
    setIsDialogOpen(true);
  };

  // Edit existing slide
  const editSlide = (slide: HeroSlide) => {
    setEditingSlide({ ...slide });
    setIsDialogOpen(true);
  };

  // Save slide (create or update)
  const saveSlide = async () => {
    if (!editingSlide) return;

    try {
      const slideData = {
        title: editingSlide.title,
        subtitle: editingSlide.subtitle,
        description: editingSlide.description,
        image_url: editingSlide.image_url,
        course_id: editingSlide.link_type === 'course' ? editingSlide.course_id : null,
        link_url: editingSlide.link_type === 'external' ? editingSlide.link_url : null,
        link_type: editingSlide.link_type,
        order_index: editingSlide.order_index,
        is_active: editingSlide.is_active,
        background_color: editingSlide.background_color,
        updated_at: new Date().toISOString(),
      };

      if (editingSlide.id === 'new') {
        // Create new slide
        const { error } = await supabase
          .from('hero_slides')
          .insert([{
            ...slideData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Slide created successfully",
        });
      } else {
        // Update existing slide
        const { error } = await supabase
          .from('hero_slides')
          .update(slideData)
          .eq('id', editingSlide.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Slide updated successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingSlide(null);
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      toast({
        title: "Error",
        description: "Failed to save slide",
        variant: "destructive",
      });
    }
  };

  // Delete slide
  const deleteSlide = async (slideId: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slideId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });
      
      fetchSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        title: "Error",
        description: "Failed to delete slide",
        variant: "destructive",
      });
    }
  };

  // Toggle slide visibility
  const toggleSlideVisibility = async (slideId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', slideId);

      if (error) throw error;

      fetchSlides();
      toast({
        title: "Success",
        description: `Slide ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling slide visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update slide visibility",
        variant: "destructive",
      });
    }
  };

  // Reorder slides
  const reorderSlides = async (newOrder: HeroSlide[]) => {
    try {
      const updates = newOrder.map((slide, index) => ({
        id: slide.id,
        order_index: index,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('hero_slides')
          .update({ order_index: update.order_index, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      setSlides(newOrder);
      toast({
        title: "Success",
        description: "Slide order updated",
      });
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast({
        title: "Error",
        description: "Failed to reorder slides",
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    setDraggedItem(slideId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = slides.findIndex(slide => slide.id === draggedItem);
    const targetIndex = slides.findIndex(slide => slide.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, removed);

    reorderSlides(newSlides);
    setDraggedItem(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading slides...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hero Slides</h2>
          <p className="text-muted-foreground">Manage your hero section carousel slides</p>
        </div>
        <Button onClick={createSlide} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Slide
        </Button>
      </div>

      {/* Slides List */}
      <div className="grid gap-4">
        {slides.map((slide) => (
          <Card 
            key={slide.id}
            className={cn(
              "cursor-move",
              draggedItem === slide.id && "opacity-50"
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, slide.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, slide.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                
                {/* Slide Preview */}
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {slide.image_url ? (
                    <img 
                      src={slide.image_url} 
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                {/* Slide Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{slide.title || 'Untitled'}</h3>
                  <p className="text-sm text-muted-foreground truncate">{slide.subtitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      Order: {slide.order_index}
                    </span>
                    {slide.link_type === 'course' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Course Link
                      </span>
                    )}
                    {slide.link_type === 'external' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        External Link
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSlideVisibility(slide.id, slide.is_active)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {slide.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editSlide(slide)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSlide(slide.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {slides.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No slides created yet</p>
              <Button onClick={createSlide}>Create your first slide</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlide?.id === 'new' ? 'Create New Slide' : 'Edit Slide'}
            </DialogTitle>
          </DialogHeader>

          {editingSlide && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={editingSlide.title}
                    onChange={(e) => setEditingSlide({
                      ...editingSlide,
                      title: e.target.value
                    })}
                    placeholder="Enter slide title"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={editingSlide.subtitle || ''}
                    onChange={(e) => setEditingSlide({
                      ...editingSlide,
                      subtitle: e.target.value
                    })}
                    placeholder="Enter slide subtitle"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingSlide.description || ''}
                    onChange={(e) => setEditingSlide({
                      ...editingSlide,
                      description: e.target.value
                    })}
                    placeholder="Enter slide description"
                    rows={3}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Background Image *</Label>
                <FileUpload
                  onUpload={(url) => setEditingSlide({
                    ...editingSlide,
                    image_url: url
                  })}
                  currentFile={editingSlide.image_url}
                  accept="image/*"
                  maxSize={5 * 1024 * 1024} // 5MB
                  bucket="hero-slides"
                />
              </div>

              {/* Link Configuration */}
              <div className="space-y-4">
                <Label>Link Configuration</Label>
                <Select
                  value={editingSlide.link_type}
                  onValueChange={(value: 'course' | 'external' | 'none') => 
                    setEditingSlide({
                      ...editingSlide,
                      link_type: value,
                      course_id: value !== 'course' ? undefined : editingSlide.course_id,
                      link_url: value !== 'external' ? undefined : editingSlide.link_url,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Link</SelectItem>
                    <SelectItem value="course">Link to Course</SelectItem>
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>

                {editingSlide.link_type === 'course' && (
                  <Select
                    value={editingSlide.course_id || ''}
                    onValueChange={(value) => setEditingSlide({
                      ...editingSlide,
                      course_id: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {editingSlide.link_type === 'external' && (
                  <Input
                    value={editingSlide.link_url || ''}
                    onChange={(e) => setEditingSlide({
                      ...editingSlide,
                      link_url: e.target.value
                    })}
                    placeholder="https://example.com"
                  />
                )}
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Show this slide in the carousel
                  </p>
                </div>
                <Switch
                  checked={editingSlide.is_active}
                  onCheckedChange={(checked) => setEditingSlide({
                    ...editingSlide,
                    is_active: checked
                  })}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSlide(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={saveSlide}
                  disabled={!editingSlide.title || !editingSlide.image_url}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Slide
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroSlideEditor;