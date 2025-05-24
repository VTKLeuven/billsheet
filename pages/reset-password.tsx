import ResetPasswordForm from "../components/ResetPasswordForm";
import React from "react";
import { NextPage } from "next";
import { Paper } from "@mantine/core";

const ResetPasswordPage: NextPage = () => {
    return (
        <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
            <div className="w-full max-w-md mx-auto">
                <Paper shadow="sm" radius="md" className="w-full p-4 sm:p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold border-b-4 border-vtk-yellow mb-6 pb-2">
                        Wachtwoord Resetten
                    </h1>
                    <ResetPasswordForm />
                </Paper>
            </div>
        </div>
    );
};

export default ResetPasswordPage;