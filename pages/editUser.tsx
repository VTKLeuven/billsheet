import { useUser, useSupabaseClient } from '../contexts/SupabaseContext';
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import type { Profile } from '../types';
import { Button, TextInput, Select, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { posts } from "../utils/constants";
import { createAdminClient } from '../lib/supabase';

interface EditUserProps {
    user: Profile;
}

export default function EditUser({ user }: EditUserProps) {
    const profile = useUser();
    const router = useRouter();
    const [name, setName] = useState('');
    const [post, setPost] = useState('');
    const [iban, setIban] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Initialize form values after user data is available
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPost(user.post || '');
            setIban(user.iban || '');
        }
    }, [user]);

    // Check admin status
    useEffect(() => {
        if (profile !== undefined) {
            setCheckingAuth(false);
            if (!profile?.admin) {
                router.push('/');
            }
        }
    }, [profile, router]);

    const updateUser = async (event: any) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/updateUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: user.id,
                    name,
                    post,
                    iban,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update user');
            }

            notifications.show({
                title: "Success",
                message: "User updated successfully",
                color: "green",
            });
            
            router.push("/users");
        } catch (error) {
            console.error("Error updating user:", error);
            notifications.show({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to update user",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while checking authentication
    if (checkingAuth) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    // Show access denied if not admin (this will redirect)
    if (!profile?.admin) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex justify-center align-center border-2 border-vtk-yellow rounded-lg p-4 sm:p-10">
            <form className="flex align-center flex-col w-full max-w-md space-y-2" onSubmit={updateUser}>
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">Edit User</h1>
                <TextInput
                    label="Name"
                    required
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Select
                    label="Post"
                    data={posts}
                    name="post"
                    required
                    value={post}
                    onChange={(value) => setPost(value || '')}
                />
                <TextInput
                    label="IBAN"
                    required
                    name="iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                />
                <Button color="vtk-yellow.5" className="bg-vtk-yellow h-[2em] mt-5 mb-5" type="submit" loading={loading}>
                    Update User
                </Button>
            </form>
        </div>
    );
}

export async function getServerSideProps(context: any) {
    const { id } = context.query;

    try {
        const supabase = createAdminClient()

        const { data: user, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching user:", error)
            return {
                notFound: true,
            };
        }

        return {
            props: {
                user,
            },
        };
    } catch (error) {
        console.error("Edit user page error:", error)
        return { notFound: true };
    }
}