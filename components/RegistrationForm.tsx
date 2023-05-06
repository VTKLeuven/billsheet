import { Button, Select, TextInput } from "@mantine/core";
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
        "G5",
        "Internationaal",
        "IT",
        "Logistiek",
        "Onderwijs",
        "Sport",
        "Theokot",
    ];
    const [error, setError] = useState("");

    const registerUser = async (event: any) => {
        event.preventDefault();
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
        if (result.error) {
            setError(result.error);
        } else {
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
            { error ? <span className="flex justify-center text-red-600 font-bold">{error}</span> : <></>}
            <Button color="vtk-yellow.5" className="bg-vtk-yellow h-[2em] m-5" type="submit">Registreer</Button>
        </form>
    );
}
