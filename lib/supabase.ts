import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { Database } from '../types/supabase'

// For client-side usage
export const createBrowserClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient<Database>(supabaseUrl, supabaseKey)
}

// For server-side usage with cookie handling
export const createServerSupabaseClient = (cookieStore: ReadonlyRequestCookies) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createServerClient<Database>(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, options) => {
                    // This would be used in Route Handlers or Server Actions
                    // We don't need to implement since we're not modifying cookies here
                },
                remove: (name, options) => {
                    // This would be used in Route Handlers or Server Actions
                    // We don't need to implement since we're not removing cookies here
                }
            }
        }
    )
}