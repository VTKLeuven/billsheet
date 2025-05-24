import { useSupabaseClient } from "../contexts/SupabaseContext";
import { Button, TextInput, PasswordInput, Alert } from '@mantine/core'
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";


export default function SignInForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const supabase = useSupabaseClient()
    const router = useRouter()

    const signIn = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            })

            if (data.user) {
                setError("")
                router.push("/")
                return;
            }

            if (error) {
                setError(error.message)
            }
        } catch (err) {
            setError("Er is een probleem opgetreden bij het inloggen")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className="flex flex-col space-y-4 w-full" onSubmit={signIn}>
            <TextInput
                label="Email"
                placeholder="voornaam.naam@vtk.be"
                type="email"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
            />

            <PasswordInput
                label="Wachtwoord"
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
            />

            {error && (
                <Alert color="red" title="Fout" className="text-sm">
                    {error}
                </Alert>
            )}

            <Button
                type="submit"
                color="vtk-yellow.5"
                fullWidth
                loading={loading}
                className="mt-2"
            >
                Inloggen
            </Button>

            <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 pt-2">
                <Link href="/reset-password" className="text-sm underline text-slate-500 hover:text-slate-700">
                    Wachtwoord vergeten?
                </Link>
                <Link href="/register" className="text-sm underline text-slate-500 hover:text-slate-700">
                    Nog geen account?
                </Link>
            </div>
        </form>
    );
}
