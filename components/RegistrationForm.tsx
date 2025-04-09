import { Button, TextInput, PasswordInput, Select } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { useState } from "react";
import { posts } from "../utils/constants";

export default function RegistrationForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [post, setPost] = useState("");
    const [iban, setIban] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const registerUser = async (event: any) => {
        event.preventDefault();
        setLoading(true);
        
        try {
            const response = await fetch('/api/registerUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    post,
                    iban
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }
            
            notifications.show({
                title: "Registratie gelukt",
                message: "Log in om verder te gaan."
            });
            
            router.push("/");
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex content-center justify-content flex-col space-y-4 min-w-[25em]" onSubmit={registerUser}>
            <TextInput 
                label="Naam" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <TextInput 
                label="Email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Select 
                label="Post" 
                required 
                data={posts} 
                value={post}
                onChange={(value) => setPost(value || "")}
            />
            <TextInput 
                label="Rekeningnummer" 
                required 
                value={iban}
                onChange={(e) => setIban(e.target.value)}
            />
            <PasswordInput 
                label="Wachtwoord" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            
            {error && <span className="flex justify-center text-red-600 font-bold">{error}</span>}
            
            <Button 
                color="vtk-yellow.5" 
                className="bg-vtk-yellow h-[2em] m-5" 
                type="submit"
                loading={loading}
            >
                Registreer
            </Button>
        </form>
    );
}
