import { useState } from "react";
import { Button, TextInput } from '@mantine/core';
import { useSupabaseClient } from "../contexts/SupabaseContext";
import Link from "next/link";

export default function ResetPasswordForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = useSupabaseClient();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setMessage("Vul een email adres in");
            setIsSuccess(false);
            return;
        }

        if (!email.endsWith("@vtk.be")) {
            setMessage("Alleen @vtk.be email adressen zijn toegestaan");
            setIsSuccess(false);
            return;
        }

        setIsLoading(true);

        try {
            // Supabase password reset - sends an email with a reset link
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) {
                setMessage(error.message);
                setIsSuccess(false);
            } else {
                setMessage("Check je email voor de reset link");
                setIsSuccess(true);
            }
        } catch (error) {
            setMessage("Er is iets misgegaan");
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="flex content-center justify-content flex-col space-y-4 min-w-[25em]"
            onSubmit={handleResetPassword}>
            <h2 className="text-2xl font-bold text-center">Wachtwoord resetten</h2>

            <TextInput
                label="Email"
                placeholder="voornaam.naam@vtk.be"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <Button
                type="submit"
                color="vtk-yellow.5"
                loading={isLoading}
                disabled={isLoading}
            >
                Reset link versturen
            </Button>

            {message && (
                <span className={`flex justify-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </span>
            )}

            <Link href="/">
                <span className="flex justify-center underline text-slate-500">
                    Terug naar inloggen
                </span>
            </Link>
        </form>
    );
}