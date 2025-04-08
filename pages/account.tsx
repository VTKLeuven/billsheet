import { useSession } from "../contexts/SessionContext";
import AuthUI from "../components/Auth";
import ProfileForm from "../components/ProfileForm";
import React from "react";

export default function Account() {
    const session = useSession();

    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            {!session ? <AuthUI /> : <ProfileForm session={session} />}
        </div>
    );
}
