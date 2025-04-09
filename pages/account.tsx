import { useSession, useAuthLoading } from "../contexts/SupabaseContext";
import AuthUI from "../components/Auth";
import ProfileForm from "../components/ProfileForm";
import React from "react";
import { Loader } from "@mantine/core";

export default function Account() {
    const session = useSession();
    const isLoading = useAuthLoading();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            {!session ? <AuthUI /> : <ProfileForm />}
        </div>
    );
}
