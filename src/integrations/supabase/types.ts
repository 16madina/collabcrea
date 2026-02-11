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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          conversation_id: string | null
          created_at: string
          creator_id: string
          id: string
          message: string | null
          offer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          message?: string | null
          offer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          message?: string | null
          offer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          agreed_amount: number
          approved_at: string | null
          auto_approve_at: string | null
          brand_feedback: string | null
          brand_id: string
          content_description: string | null
          content_submitted_at: string | null
          content_url: string | null
          conversation_id: string | null
          created_at: string
          creator_amount: number
          creator_id: string
          deadline: string
          id: string
          offer_id: string
          platform_fee: number
          status: string
          updated_at: string
        }
        Insert: {
          agreed_amount: number
          approved_at?: string | null
          auto_approve_at?: string | null
          brand_feedback?: string | null
          brand_id: string
          content_description?: string | null
          content_submitted_at?: string | null
          content_url?: string | null
          conversation_id?: string | null
          created_at?: string
          creator_amount?: number
          creator_id: string
          deadline: string
          id?: string
          offer_id: string
          platform_fee?: number
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_amount?: number
          approved_at?: string | null
          auto_approve_at?: string | null
          brand_feedback?: string | null
          brand_id?: string
          content_description?: string | null
          content_submitted_at?: string | null
          content_url?: string | null
          conversation_id?: string | null
          created_at?: string
          creator_amount?: number
          creator_id?: string
          deadline?: string
          id?: string
          offer_id?: string
          platform_fee?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          application_id: string | null
          created_at: string
          created_by: string
          id: string
          offer_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          offer_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          offer_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated_by: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_updated_by?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated_by?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string | null
          id: string
          message: string
          name: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          name: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          brand_id: string
          budget_max: number
          budget_min: number
          category: string
          content_type: string
          created_at: string
          deadline: string | null
          description: string
          id: string
          images: string[] | null
          location: string | null
          logo_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          budget_max: number
          budget_min: number
          category: string
          content_type: string
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          images?: string[] | null
          location?: string | null
          logo_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          budget_max?: number
          budget_min?: number
          category?: string
          content_type?: string
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          images?: string[] | null
          location?: string | null
          logo_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          media_type: string
          media_url: string
          platform: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          media_url: string
          platform?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          media_url?: string
          platform?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banner_url: string | null
          bio: string | null
          category: string | null
          company_description: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email_verified: boolean | null
          facebook_followers: string | null
          followers: string | null
          full_name: string
          id: string
          identity_document_url: string | null
          identity_method: string | null
          identity_submitted_at: string | null
          identity_verified: boolean | null
          instagram_followers: string | null
          is_banned: boolean | null
          logo_url: string | null
          pricing: Json | null
          residence_country: string | null
          sector: string | null
          selfie_url: string | null
          snapchat_followers: string | null
          tiktok_followers: string | null
          updated_at: string
          user_id: string
          website: string | null
          youtube_followers: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          category?: string | null
          company_description?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email_verified?: boolean | null
          facebook_followers?: string | null
          followers?: string | null
          full_name: string
          id?: string
          identity_document_url?: string | null
          identity_method?: string | null
          identity_submitted_at?: string | null
          identity_verified?: boolean | null
          instagram_followers?: string | null
          is_banned?: boolean | null
          logo_url?: string | null
          pricing?: Json | null
          residence_country?: string | null
          sector?: string | null
          selfie_url?: string | null
          snapchat_followers?: string | null
          tiktok_followers?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          youtube_followers?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banner_url?: string | null
          bio?: string | null
          category?: string | null
          company_description?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email_verified?: boolean | null
          facebook_followers?: string | null
          followers?: string | null
          full_name?: string
          id?: string
          identity_document_url?: string | null
          identity_method?: string | null
          identity_submitted_at?: string | null
          identity_verified?: boolean | null
          instagram_followers?: string | null
          is_banned?: boolean | null
          logo_url?: string | null
          pricing?: Json | null
          residence_country?: string | null
          sector?: string | null
          selfie_url?: string | null
          snapchat_followers?: string | null
          tiktok_followers?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          youtube_followers?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          report_type: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_offer_id: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_offer_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_offer_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_verifications: {
        Row: {
          admin_notes: string | null
          ai_confidence: number | null
          ai_extracted_followers: string | null
          ai_extracted_name: string | null
          ai_reason: string | null
          claimed_followers: string
          created_at: string
          id: string
          page_name: string
          platform: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_extracted_followers?: string | null
          ai_extracted_name?: string | null
          ai_reason?: string | null
          claimed_followers: string
          created_at?: string
          id?: string
          page_name: string
          platform: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          ai_confidence?: number | null
          ai_extracted_followers?: string | null
          ai_extracted_name?: string | null
          ai_reason?: string | null
          claimed_followers?: string
          created_at?: string
          id?: string
          page_name?: string
          platform?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          collaboration_id: string | null
          created_at: string
          description: string | null
          fee: number
          id: string
          net_amount: number
          reference: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string | null
          withdrawal_details: Json | null
          withdrawal_method: string | null
        }
        Insert: {
          amount: number
          collaboration_id?: string | null
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          net_amount?: number
          reference?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_id?: string | null
          withdrawal_details?: Json | null
          withdrawal_method?: string | null
        }
        Update: {
          amount?: number
          collaboration_id?: string | null
          created_at?: string
          description?: string | null
          fee?: number
          id?: string
          net_amount?: number
          reference?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
          withdrawal_details?: Json | null
          withdrawal_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          pending_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_holder: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          created_at: string
          id: string
          method: string
          mobile_number: string | null
          mobile_provider: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          id?: string
          method: string
          mobile_number?: string | null
          mobile_provider?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          method?: string
          mobile_number?: string | null
          mobile_provider?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_initiate_contact: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_user_verified: { Args: { _user_id: string }; Returns: boolean }
      send_push_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_title: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "creator" | "brand" | "admin"
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
      app_role: ["creator", "brand", "admin"],
    },
  },
} as const
