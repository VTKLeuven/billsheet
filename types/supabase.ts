export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bills: {
        Row: {
          activity: string
          amount: number
          booked: boolean
          created_at: string | null
          date: string | null
          desc: string
          iban: string
          id: number
          image: string
          name: string
          paid: boolean
          payment_method: string
          post: string
          uid: string | null
        }
        Insert: {
          activity?: string
          amount?: number
          booked?: boolean
          created_at?: string | null
          date?: string | null
          desc?: string
          iban?: string
          id?: number
          image?: string
          name?: string
          paid?: boolean
          payment_method?: string
          post?: string
          uid?: string | null
        }
        Update: {
          activity?: string
          amount?: number
          booked?: boolean
          created_at?: string | null
          date?: string | null
          desc?: string
          iban?: string
          id?: number
          image?: string
          name?: string
          paid?: boolean
          payment_method?: string
          post?: string
          uid?: string | null
        }
      }
      profiles: {
        Row: {
          allowed_posts: string | null;
          admin: boolean | null
          iban: string | null
          id: string
          name: string | null
          post: string | null
          updated_at: string | null
        }
        Insert: {
          admin?: boolean | null
          iban?: string | null
          id: string
          name?: string | null
          post?: string | null
          updated_at?: string | null
        }
        Update: {
          admin?: boolean | null
          iban?: string | null
          id?: string
          name?: string | null
          post?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
