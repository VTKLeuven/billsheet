import { useState } from "react";
import { Button, PasswordInput } from '@mantine/core';
import { useSupabaseClient } from "../contexts/SupabaseContext";
import { useRouter } from "next/router";

export default function UpdatePasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = useSupabaseClient();
    const router = useRouter();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password
        if (password.length < 6) {
            setMessage("Wachtwoord moet minstens 6 tekens bevatten");
            setIsSuccess(false);
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Wachtwoorden komen niet overeen");
            setIsSuccess(false);
            return;
        }

        setIsLoading(true);

        try {
            // Update the password
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setMessage(error.message);
                setIsSuccess(false);
            } else {
                setMessage("Wachtwoord succesvol bijgewerkt");
                setIsSuccess(true);

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    router.push("/");
                }, 2000);
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
            onSubmit={handleUpdatePassword}>
            <h2 className="text-2xl font-bold text-center">Nieuw wachtwoord instellen</h2>

            <PasswordInput
                label="Nieuw wachtwoord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <PasswordInput
                label="Bevestig nieuw wachtwoord"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
                type="submit"
                color="vtk-yellow.5"
                loading={isLoading}
                disabled={isLoading}
            >
                Wachtwoord bijwerken
            </Button>

            {message && (
                <span className={`flex justify-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </span>
            )}
        </form>
    );
}