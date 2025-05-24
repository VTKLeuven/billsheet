import { createContext, useContext, useState, useEffect } from 'react';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import type { Profile } from '../types';
import Cookies from 'js-cookie';

type SupabaseContextType = {
    supabaseClient: SupabaseClient<Database>;
    session: Session | null;
    user: Profile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({
    children,
    supabaseClient,
}: {
    children: React.ReactNode;
    supabaseClient: SupabaseClient<Database>;
}) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile data
    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
            return null;
        }
    };

    // Refresh profile data when needed
    const refreshProfile = async () => {
        if (session?.user?.id) {
            const userData = await fetchUserProfile(session.user.id);
            setUser(userData);
        }
    };

    // First effect: handle session state
    useEffect(() => {
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
            (_, newSession) => {
                setSession(newSession);
            }
        );

        // Initial session check
        supabaseClient.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseClient]);

    // Second effect: handle user data based on session
    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true);

            if (session?.user?.id) {
                // Set the access token as an HTTP-only cookie when session changes
                if (session.access_token) {
                    Cookies.set('supabase-auth-token', session.access_token, { 
                        expires: 7, // 7 days expiry
                        sameSite: 'strict',
                        path: '/'
                    });
                }
                
                const userData = await fetchUserProfile(session.user.id);
                setUser(userData);
            } else {
                setUser(null);
                // Remove the cookie when logged out
                Cookies.remove('supabase-auth-token');
            }

            setIsLoading(false);
        };

        loadUserData();
    }, [session, supabaseClient]);

    const value = {
        supabaseClient,
        session,
        user,
        isLoading,
        refreshProfile,
    };

    return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

// Custom hooks to access context values
export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};

export const useSupabaseClient = () => {
    return useSupabase().supabaseClient;
};

export const useSession = () => {
    return useSupabase().session;
};

export const useUser = () => {
    return useSupabase().user;
};

export const useAuthLoading = () => {
    return useSupabase().isLoading;
};