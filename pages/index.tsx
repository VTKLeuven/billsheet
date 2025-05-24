import { useSession } from "../contexts/SupabaseContext";
import AuthUI from "../components/Auth";
import Form from "../components/Form";
import React from "react";

export default function Home() {
    const session = useSession();

    return (
        <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
            <div className="w-full max-w-3xl mx-auto">
                {session ? <Form /> : <AuthUI />}
            </div>
        </div>
    );
}
