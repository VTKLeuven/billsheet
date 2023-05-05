import {
    useSession,
    useSupabaseClient,
    useUser,
} from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import AuthUI from "../components/Auth";
import Form from "../components/Form";
import ProfileForm from "../components/ProfileForm";

export default function Home() {
    const supabase = useSupabaseClient();
    const session = useSession();
    const user = useUser();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        getProfile();
    }, [session]);

    async function getProfile() {
        try {
            if (!user) {
                return;
            }
            let {
                data: profile,
                error,
                status,
            } = await supabase
                .from("profiles")
                .select()
                .eq("id", user.id)
                .single();
            console.log(profile, error, status);
            if (profile.name && profile.post) {
                setProfile(profile);
            }
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            {!session ? <AuthUI /> : <>{!profile ? <ProfileForm session={session}/> : <Form profile={profile} />}</>}
        </div>
    );
}
