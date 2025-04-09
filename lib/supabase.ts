import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// Environment variable validation for browser client (public)
const getBrowserEnvVars = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    return { supabaseUrl, supabaseAnonKey }
}

// Environment variable validation for admin client
const getAdminEnvVars = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!supabaseServiceRole) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    return { supabaseUrl, supabaseServiceRole }
}

// For client-side usage
export const createBrowserClient = () => {
    const { supabaseUrl, supabaseAnonKey } = getBrowserEnvVars()
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// For admin operations in API routes and server-side functions
export const createAdminClient = () => {
    const { supabaseUrl, supabaseServiceRole } = getAdminEnvVars()
    return createClient<Database>(supabaseUrl, supabaseServiceRole)
}