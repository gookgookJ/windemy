export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_note_comments: {
        Row: {
          comment_text: string
          created_at: string
          created_by: string
          id: string
          note_id: string
          updated_at: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          created_by: string
          id?: string
          note_id: string
          updated_at?: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          created_by?: string
          id?: string
          note_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_note_comments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "admin_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_update_history: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          posts_data: Json
          posts_fetched: number
          success: boolean
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          posts_data: Json
          posts_fetched: number
          success?: boolean
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          posts_data?: Json
          posts_fetched?: number
          success?: boolean
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applicable_courses: string[] | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          name: string
          usage_limit: number | null
          used_count: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_courses?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_until: string
        }
        Update: {
          applicable_courses?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          name?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_detail_images: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          image_name: string | null
          image_url: string
          order_index: number
          section_title: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          image_name?: string | null
          image_url: string
          order_index?: number
          section_title?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          image_name?: string | null
          image_url?: string
          order_index?: number
          section_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_detail_images_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_drafts: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data: Json
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_favorites: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      course_materials: {
        Row: {
          course_id: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          order_index: number
          section_id: string | null
          session_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_index?: number
          section_id?: string | null
          session_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_index?: number
          section_id?: string | null
          session_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_materials_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_options: {
        Row: {
          benefits: string[] | null
          course_id: string | null
          created_at: string | null
          id: string
          name: string
          original_price: number | null
          price: number
          tag: string | null
        }
        Insert: {
          benefits?: string[] | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          original_price?: number | null
          price: number
          tag?: string | null
        }
        Update: {
          benefits?: string[] | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          original_price?: number | null
          price?: number
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_options_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          rating: number | null
          review_text: string | null
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review_text?: string | null
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_sections: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          course_id: string | null
          created_at: string
          id: string
          order_index: number
          title: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          is_free: boolean | null
          order_index: number
          section_id: string | null
          title: string
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_free?: boolean | null
          order_index: number
          section_id?: string | null
          title: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          section_id?: string | null
          title?: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_duration_days: number | null
          category_id: string | null
          course_type: string
          created_at: string | null
          detail_image_path: string | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          level: string | null
          price: number
          rating: number | null
          requirements: string[] | null
          tags: string[] | null
          thumbnail_path: string | null
          thumbnail_url: string | null
          title: string
          total_students: number | null
          updated_at: string | null
          video_preview_url: string | null
          what_you_will_learn: string[] | null
        }
        Insert: {
          access_duration_days?: number | null
          category_id?: string | null
          course_type?: string
          created_at?: string | null
          detail_image_path?: string | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string | null
          price?: number
          rating?: number | null
          requirements?: string[] | null
          tags?: string[] | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          title: string
          total_students?: number | null
          updated_at?: string | null
          video_preview_url?: string | null
          what_you_will_learn?: string[] | null
        }
        Update: {
          access_duration_days?: number | null
          category_id?: string | null
          course_type?: string
          created_at?: string | null
          detail_image_path?: string | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          level?: string | null
          price?: number
          rating?: number | null
          requirements?: string[] | null
          tags?: string[] | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          title?: string
          total_students?: number | null
          updated_at?: string | null
          video_preview_url?: string | null
          what_you_will_learn?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string | null
          enrolled_at: string | null
          expires_at: string | null
          id: string
          progress: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          background_color: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          is_draft: boolean | null
          link_type: string
          link_url: string | null
          order_index: number
          published_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          is_draft?: boolean | null
          link_type?: string
          link_url?: string | null
          order_index?: number
          published_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_color?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          is_draft?: boolean | null
          link_type?: string
          link_url?: string | null
          order_index?: number
          published_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hero_slides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hero_slides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hero_slides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      homepage_section_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_draft: boolean | null
          order_index: number
          section_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          order_index?: number
          section_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          order_index?: number
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_section_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_section_courses_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "homepage_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          created_at: string
          display_limit: number
          filter_type: string
          filter_value: string | null
          icon_type: string
          icon_value: string
          id: string
          is_active: boolean
          is_draft: boolean | null
          order_index: number
          published_at: string | null
          section_type: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_limit?: number
          filter_type?: string
          filter_value?: string | null
          icon_type?: string
          icon_value?: string
          id?: string
          is_active?: boolean
          is_draft?: boolean | null
          order_index?: number
          published_at?: string | null
          section_type?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_limit?: number
          filter_type?: string
          filter_value?: string | null
          icon_type?: string
          icon_value?: string
          id?: string
          is_active?: boolean
          is_draft?: boolean | null
          order_index?: number
          published_at?: string | null
          section_type?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          instructor_avatar_url: string | null
          instructor_bio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          order_id: string | null
          price: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          price: number
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          payment_method: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          expires_at: string | null
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          instructor_avatar_url: string | null
          instructor_bio: string | null
          marketing_consent: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          count: number | null
          created_at: string | null
          id: string
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          action_type: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          action_type?: string
          count?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      role_change_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_role: string | null
          old_role: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_file_downloads: {
        Row: {
          downloaded_at: string
          file_name: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          file_name: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          file_name?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_file_downloads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          session_id: string | null
          user_id: string | null
          watched_duration_seconds: number | null
          watched_ranges: Json | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          watched_duration_seconds?: number | null
          watched_ranges?: Json | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          watched_duration_seconds?: number | null
          watched_ranges?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "session_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "session_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          coupon_id: string
          id: string
          is_used: boolean
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          coupon_id: string
          id?: string
          is_used?: boolean
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          coupon_id?: string
          id?: string
          is_used?: boolean
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_coupons_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_group_memberships: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_memberships_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_memberships_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_group_memberships_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_groups: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_checkpoints: {
        Row: {
          checkpoint_time: number
          id: string
          is_natural: boolean | null
          reached_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          checkpoint_time: number
          id?: string
          is_natural?: boolean | null
          reached_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          checkpoint_time?: number
          id?: string
          is_natural?: boolean | null
          reached_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_checkpoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_seek_events: {
        Row: {
          created_at: string | null
          from_time: number
          id: string
          jump_amount: number
          session_id: string
          to_time: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_time: number
          id?: string
          jump_amount: number
          session_id: string
          to_time: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_time?: number
          id?: string
          jump_amount?: number
          session_id?: string
          to_time?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_seek_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_segments: {
        Row: {
          created_at: string | null
          duration: number
          end_time: number
          id: string
          session_id: string
          start_time: number
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          duration: number
          end_time: number
          id?: string
          session_id: string
          start_time: number
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number
          end_time?: number
          id?: string
          session_id?: string
          start_time?: number
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_segments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_activity_stats: {
        Row: {
          action_types: string[] | null
          active_days: number | null
          last_activity: string | null
          total_activities: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_enrollment_summary: {
        Row: {
          completed_courses: number | null
          email: string | null
          full_name: string | null
          last_enrollment_date: string | null
          last_order_date: string | null
          total_enrollments: number | null
          total_orders: number | null
          total_spent: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_group_summary: {
        Row: {
          email: string | null
          full_name: string | null
          group_colors: string[] | null
          group_count: number | null
          group_names: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
      user_points_balance: {
        Row: {
          total_earned: number | null
          total_points: number | null
          total_used: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_enrollment_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_group_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          action_name: string
          max_requests?: number
          user_uuid: string
          window_minutes?: number
        }
        Returns: boolean
      }
      check_security: { Args: never; Returns: string }
      cleanup_old_activity_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      ensure_test_users: { Args: never; Returns: string }
      expire_points: { Args: never; Returns: undefined }
      get_course_enrollment_stats: {
        Args: { course_uuid: string }
        Returns: {
          active_enrollments: number
          completed_enrollments: number
          course_id: string
          total_enrollments: number
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_instructor_public_info: {
        Args: { instructor_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          instructor_avatar_url: string
          instructor_bio: string
          updated_at: string
        }[]
      }
      get_instructor_safe: {
        Args: { instructor_uuid: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          instructor_avatar_url: string
          instructor_bio: string
          updated_at: string
        }[]
      }
      get_instructors_public: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          instructor_avatar_url: string
          instructor_bio: string
          updated_at: string
        }[]
      }
      get_user_activity_logs: {
        Args: { target_user_id?: string }
        Returns: {
          action: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }[]
      }
      get_user_activity_stats: {
        Args: { target_user_id?: string }
        Returns: {
          action_types: string[]
          active_days: number
          last_activity: string
          total_activities: number
          user_id: string
        }[]
      }
      get_user_activity_stats_safe: {
        Args: { target_user_id?: string }
        Returns: {
          action_types: string[]
          active_days: number
          last_activity: string
          total_activities: number
          user_id: string
        }[]
      }
      get_user_enrollment_summary: {
        Args: { target_user_id?: string }
        Returns: {
          completed_courses: number
          email: string
          full_name: string
          last_enrollment_date: string
          last_order_date: string
          total_enrollments: number
          total_orders: number
          total_spent: number
          user_id: string
        }[]
      }
      get_user_group_summary_safe: {
        Args: { target_user_id?: string }
        Returns: {
          email: string
          full_name: string
          group_colors: string[]
          group_count: number
          group_names: string[]
          user_id: string
        }[]
      }
      get_user_points_balance: { Args: { p_user_id: string }; Returns: number }
      get_user_points_balance_safe: {
        Args: { target_user_id?: string }
        Returns: {
          total_earned: number
          total_points: number
          total_used: number
          user_id: string
        }[]
      }
      get_user_role_safe: { Args: { user_uuid?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_used_count: {
        Args: { coupon_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_instructor_safe: { Args: { user_uuid?: string }; Returns: boolean }
      log_security_event: {
        Args: { details_param?: Json; event_type_param: string }
        Returns: undefined
      }
      log_user_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      sanitize_user_input: { Args: { input_text: string }; Returns: string }
      security_comprehensive_check: { Args: never; Returns: string }
      security_quick_check: { Args: never; Returns: string }
      test_rls_security: {
        Args: never
        Returns: {
          actual_result: string
          expected_result: string
          status: string
          table_name: string
          test_name: string
        }[]
      }
      validate_user_session: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "instructor" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "instructor", "student"],
    },
  },
} as const
