import { useSession } from "../contexts/SupabaseContext";
import Link from "next/link";
import { useRouter } from "next/router";
import RegistrationForm from "../components/RegistrationForm";
import React, { useEffect } from "react";
import { Paper } from "@mantine/core";

export default function Register() {
    const session = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session) {
            router.push("/");
        }
    }, [session, router]);

    return (
        <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
            <div className="w-full max-w-md mx-auto">
                <Paper shadow="sm" radius="md" className="w-full p-4 sm:p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold border-b-4 border-vtk-yellow mb-6 pb-2">
                        Registreren
                    </h1>
                    <RegistrationForm />
                    <Link href="/">
                        <span className="block text-center mt-6 underline text-slate-500 hover:text-slate-700">
                            Heb je al een account?
                        </span>
                    </Link>
                </Paper>
            </div>
        </div>
    );
}
