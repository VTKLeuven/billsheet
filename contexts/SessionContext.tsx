import { createContext, useContext, useState, useEffect } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

type SupabaseContextType = {
    supabaseClient: SupabaseClient<Database>;
    user: User | null;
    session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SessionContextProvider({
    children,
    supabaseClient,
}: {
    children: React.ReactNode;
    supabaseClient: SupabaseClient<Database>;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getActiveSession() {
            const { data: { session: activeSession } } = await supabaseClient.auth.getSession();
            setSession(activeSession);
            setUser(activeSession?.user ?? null);
            setIsLoading(false);
        }

        getActiveSession();

        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
            (_event, currentSession) => {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabaseClient]);

    const value = {
        supabaseClient,
        user,
        session,
    };

    return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export const useSupabaseClient = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabaseClient must be used within a SessionContextProvider');
    }
    return context.supabaseClient;
};

export const useUser = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a SessionContextProvider');
    }
    return context.user;
};

export const useSession = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionContextProvider');
    }
    return context.session;
};