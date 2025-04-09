import UpdatePasswordForm from "../components/UpdatePasswordForm";
import React from "react";
import { NextPage } from "next";
import { useSession } from "../contexts/SupabaseContext";
import { Loader } from "@mantine/core";

const UpdatePasswordPage: NextPage = () => {
    const session = useSession();

    // Show loader while checking session state
    if (session === undefined) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    // User needs to be authenticated to reset password
    // The auth.resetPasswordForEmail will create a session for the user
    // when they click the reset link in their email
    if (!session) {
        return (
            <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
                <p>De reset link is verlopen. Probeer opnieuw een wachtwoord reset aan te vragen.</p>
            </div>
        );
    }

    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            <UpdatePasswordForm />
        </div>
    );
};

export default UpdatePasswordPage;