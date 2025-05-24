import { useUser, useSupabaseClient } from '../contexts/SupabaseContext';
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import type { Profile } from '../types';
import { Button, TextInput, Select, Loader, Paper, Text } from "@mantine/core";
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

    const updateUser = async (event: React.FormEvent) => {
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
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
            <div className="w-full max-w-lg mx-auto">
                <Paper shadow="sm" radius="md" className="w-full p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <Text size="xl" weight={700} className="text-vtk-blue border-b-4 border-vtk-yellow pb-2">
                            Edit User
                        </Text>
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => router.push('/users')}
                            className="hidden sm:block"
                        >
                            Back to Users
                        </Button>
                    </div>

                    <form className="flex flex-col space-y-4 w-full" onSubmit={updateUser}>
                        <TextInput
                            label="Name"
                            required
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full"
                        />

                        <Select
                            label="Post"
                            data={posts}
                            name="post"
                            required
                            value={post}
                            onChange={(value) => setPost(value || '')}
                            className="w-full"
                        />

                        <TextInput
                            label="IBAN"
                            required
                            name="iban"
                            value={iban}
                            onChange={(e) => setIban(e.target.value)}
                            className="w-full"
                        />

                        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/users')}
                                fullWidth
                                className="sm:hidden"
                            >
                                Cancel
                            </Button>

                            <Button
                                color="vtk-yellow"
                                type="submit"
                                loading={loading}
                                fullWidth
                                className="sm:w-auto"
                            >
                                Update User
                            </Button>
                        </div>
                    </form>
                </Paper>
            </div>
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