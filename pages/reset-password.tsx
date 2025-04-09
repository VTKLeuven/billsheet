import ResetPasswordForm from "../components/ResetPasswordForm";
import React from "react";
import { NextPage } from "next";

const ResetPasswordPage: NextPage = () => {
    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            <ResetPasswordForm />
        </div>
    );
};

export default ResetPasswordPage;