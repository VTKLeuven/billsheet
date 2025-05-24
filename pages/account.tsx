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
        <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
            <div className="w-full max-w-3xl mx-auto">
                {!session ? <AuthUI /> : <ProfileForm />}
            </div>
        </div>
    );
}
