import { useSupabaseClient } from "../contexts/SupabaseContext";
import { Button, TextInput, PasswordInput } from '@mantine/core'
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";


export default function SignInForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const supabase = useSupabaseClient()
    const router = useRouter()

    const signIn = async (event: React.FormEvent) => {
        event.preventDefault()
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
    }

    return (
        <form className="flex content-center justify-content flex-col space-y-4 min-w-[25em]" onSubmit={signIn}>
            <TextInput
                label="Email"
                placeholder="voornaam.naam@vtk.be"
                onChange={(e) => setEmail(e.target.value)} />
            <PasswordInput
                label="Wachtwoord"
                onChange={(e) => setPassword(e.target.value)} />

            <Button type="submit" color="vtk-yellow.5">Inloggen</Button>

            {error ? <span className="flex justify-center text-red-600">{error}</span> : <></>}
            <div className="flex justify-between">
                <Link href="/reset-password">
                    <span className="underline text-slate-500">Wachtwoord vergeten?</span>
                </Link>
                <Link href="/register">
                    <span className="underline text-slate-500">Nog geen account?</span>
                </Link>
            </div>
        </form>
    );
}
