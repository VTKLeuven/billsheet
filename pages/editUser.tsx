import { useUser, useSupabaseClient } from '../contexts/SupabaseContext';
import { useRouter } from "next/router";
import { useState } from "react";
import type { Profile } from '../types';
import { Button, TextInput, Select } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { posts } from "../utils/constants";
import { createAdminClient } from '../lib/supabase';

interface EditUserProps {
    user: Profile;
}

export default function EditUser({ user }: EditUserProps) {
    const supabase = useSupabaseClient();
    const profile = useUser();
    const router = useRouter();
    const [name, setName] = useState(user.name);
    const [post, setPost] = useState(user.post);
    const [iban, setIban] = useState(user.iban);
    const [loading, setLoading] = useState(false);

    if (!profile?.admin) {
        return <p>Access Denied</p>;
    }

    const updateUser = async (event: any) => {
        event.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from("profiles")
            .update({ name, post, iban })
            .eq("id", user.id);

        setLoading(false);

        if (error) {
            notifications.show({
                title: "Error",
                message: "Failed to update user",
            });
        } else {
            notifications.show({
                title: "Success",
                message: "User updated successfully",
            });
            router.push("/users");
        }
    };

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
                    value={name ?? ''}
                    onChange={(e) => setName(e.target.value)}
                />
                <Select
                    label="Post"
                    data={posts}
                    name="post"
                    required
                    value={post}
                    onChange={(value) => setPost(value)}
                />
                <TextInput
                    label="IBAN"
                    required
                    name="iban"
                    value={iban ?? ''}
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