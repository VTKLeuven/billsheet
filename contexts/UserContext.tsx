import { createContext, useContext, useEffect, useState } from "react";
import { useUser as useSupabaseUser } from "../contexts/SessionContext";
import getUserData from "../lib/getUser";
import type { Profile } from "../types";

interface UserContextType {
    user: Profile | null | undefined;
    resetUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const supabaseUser = useSupabaseUser();
    const [user, setUser] = useState<Profile | null>();

    useEffect(() => {
        const fetchUserData = async () => {
            if (supabaseUser) {
                const userData = await getUserData(supabaseUser.id);
                setUser(userData);
            } else {
                setUser(null);
            }
        };
        fetchUserData();
    }, [supabaseUser]);

    const resetUser = () => {
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, resetUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};