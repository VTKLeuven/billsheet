import { useSession } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import RegistrationForm from "../components/RegistrationForm";
import React from "react";

export default function Home() {
    const session = useSession();
    const router = useRouter()

    if (session) {
        router.push("/");
    }

    return (
        <div className="flex min-w-full min-h-full object-fill justify-center align-center m-10">
            <div >
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">
                    Registreren
                </h1>
                <RegistrationForm />
                <Link href="/"> <span className="flex justify-center underline text-slate-500">Heb je al een account?</span> </Link>
            </div>
        </div>
    );
}
