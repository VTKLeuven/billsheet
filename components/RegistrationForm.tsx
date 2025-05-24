import { Button, TextInput, PasswordInput, Select, Alert } from '@mantine/core';
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

    const registerUser = async (event: React.FormEvent) => {
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
                message: "Log in om verder te gaan.",
                color: "green"
            });
            
            router.push("/");
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col space-y-4 w-full" onSubmit={registerUser}>
            <TextInput 
                label="Naam" 
                placeholder="Je volledige naam"
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
            />
            
            <TextInput 
                label="Email" 
                placeholder="voornaam.naam@vtk.be"
                type="email"
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
            />
            
            <Select 
                label="Post" 
                placeholder="Selecteer een post"
                required 
                data={posts} 
                value={post}
                onChange={(value) => setPost(value || "")}
                className="w-full"
            />
            
            <TextInput 
                label="Rekeningnummer" 
                placeholder="IBAN"
                required 
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full"
            />
            
            <PasswordInput 
                label="Wachtwoord" 
                placeholder="Minimaal 6 karakters"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
            />
            
            {error && (
                <Alert color="red" title="Fout bij registratie" className="mt-2">
                    {error}
                </Alert>
            )}
            
            <Button 
                color="vtk-yellow" 
                type="submit"
                loading={loading}
                fullWidth
                size="md"
                className="mt-6"
            >
                Registreer
            </Button>
        </form>
    );
}
