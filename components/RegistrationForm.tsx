import { Button, Select, TextInput, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

export default function RegistrationForm() {
    const posts = [
        "Activiteiten",
        "Bedrijvenrelaties",
        "Communicatie",
        "Cultuur",
        "Cursusdienst",
        "Development",
        "Fakbar",
        "Beheer",
        "Secretaris",
        "Vice-Praeses",
        "Praeses",
        "Internationaal",
        "IT",
        "Logistiek",
        "Onderwijs",
        "Sport",
        "Theokot",
        "Ploeg",
    ];
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const registerUser = async (event: any) => {
        event.preventDefault();
        setLoading(true);
        const res = await fetch("/api/registerUser", {
            body: JSON.stringify({
                name: event.target.name.value,
                email: event.target.email.value,
                post: event.target.post.value,
                iban: event.target.iban.value,
                password: event.target.password.value,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });
        const result = await res.json();
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            notifications.show({
                title: "Registratie gelukt",
                message: "Gelieve uw email te bevestigen alvorens in te loggen."
            })
            setError("");
            window.location.href = "/";
        }
    };

    return (
        <form className="flex content-center justify-content flex-col min-w-[25em]" onSubmit={registerUser}>
            <TextInput label="Naam" required name="name" />
            <TextInput label="Email" required name="email" />
            <Select label="Post" required name="post" data={posts} />
            <TextInput label="Rekeningnummer" required name="iban" />
            <TextInput label="Wachtwoord" required name="password" type="password" />
            {error ? <span className="flex justify-center text-red-600 font-bold">{error}</span> : <></>}
            <Button color="vtk-yellow.5" className="bg-vtk-yellow h-[2em] m-5" type="submit">{loading ? <Loader /> : "Registreer"}</Button>
        </form>
    );
}
