import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button, createStyles, TextInput, PasswordInput } from '@mantine/core'
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

    const signIn = async (event: any) => {
        event.preventDefault()
        setLoading(true)
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
        setLoading(false)
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

            <Button color="vtk-yellow.5" onClick={signIn}>Inloggen</Button>


            {error ? <span className="flex justify-center text-red-600">{error}</span> : <></>}
            <Link href="/register">
                <span className="flex justify-center underline text-slate-500">Nog geen account?</span>
            </Link>
        </form>
    );
}
