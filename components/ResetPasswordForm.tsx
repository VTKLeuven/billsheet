import { useState } from "react";
import { Button, TextInput, Alert, Text } from '@mantine/core';
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
        <form className="flex flex-col space-y-4 w-full" onSubmit={handleResetPassword}>
            <Text size="sm" color="dimmed" className="mb-4">
                Vul je email adres in om een wachtwoord reset link te ontvangen.
            </Text>

            <TextInput
                label="Email"
                placeholder="voornaam.naam@vtk.be"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
            />

            {message && (
                <Alert 
                    color={isSuccess ? "green" : "red"} 
                    title={isSuccess ? "Succes!" : "Fout"}
                >
                    {message}
                </Alert>
            )}

            <Button
                type="submit"
                color="vtk-yellow"
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                size="md"
                className="mt-6"
            >
                Reset link versturen
            </Button>

            <Link href="/" className="flex justify-center mt-4">
                <span className="text-center underline text-slate-500 hover:text-slate-700">
                    Terug naar inloggen
                </span>
            </Link>
        </form>
    );
}