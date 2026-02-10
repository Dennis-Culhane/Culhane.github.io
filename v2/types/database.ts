// types/database.ts
// TODO: Replace with auto-generated types from `supabase gen types typescript`

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          authors: string;
          published_date: string | null;
          abstract: string;
          pdf_url: string | null;
          pdf_filename: string | null;
          source_type: 'uploaded' | 'external';
          external_url: string | null;
          citation_count: number;
          is_featured: boolean;
          search_vector: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at' | 'search_vector'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      article_categories: {
        Row: {
          article_id: string;
          category_id: number;
        };
        Insert: {
          article_id: string;
          category_id: number;
        };
        Update: Partial<Database['public']['Tables']['article_categories']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          positions: string[];
          biography: string[];
          image_url: string | null;
          cv_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      subscribers: {
        Row: {
          id: number;
          email: string;
          subscribed_at: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['subscribers']['Row'], 'id' | 'subscribed_at'> & {
          id?: number;
          subscribed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>;
      };
    };
    Functions: {
      search_articles: {
        Args: {
          search_query: string;
          page_limit?: number;
          page_offset?: number;
        };
        Returns: Database['public']['Tables']['articles']['Row'][];
      };
    };
  };
};
