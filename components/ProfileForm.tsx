import { useState } from "react";
import { useSupabase } from "../contexts/SupabaseContext";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { posts } from "../utils/constants";
import { TextInput, Select, Button, Paper, Box, Text, Loader } from "@mantine/core";

export default function ProfileForm() {
    const { supabaseClient, user, refreshProfile } = useSupabase();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        post: user?.post || '',
        iban: user?.iban || '',
    });

    // Handle input changes
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    async function updateProfile() {
        try {
            setLoading(true);
            if (!user) throw new Error("No user authenticated");

            const update_data = {
                id: user.id,
                name: formData.name,
                post: formData.post,
                iban: formData.iban,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabaseClient.from("profiles").upsert(update_data);
            if (error) throw error;

            await refreshProfile(); // Refresh the profile data in context

            notifications.show({
                title: "Success",
                message: "Profile updated!",
                color: "green"
            });
            router.push("/");
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Error while updating profile",
                color: "red"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await supabaseClient.auth.signOut();
        router.push("/");
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <Loader size="md" color="vtk-yellow" />
            </div>
        );
    }

    return (
        <Paper shadow="xs" radius="md" className="w-full mx-auto">
            <Box className="p-4 sm:p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <Text size="xl" weight={700} className="text-vtk-blue border-b-4 border-vtk-yellow pb-2">
                        Mijn Profiel
                    </Text>
                    <Button variant="subtle" color="gray" onClick={handleLogout}>
                        Uitloggen
                    </Button>
                </div>

                <div className="space-y-6">
                    <TextInput
                        label="Naam"
                        placeholder="Je volledige naam"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full"
                    />

                    <Select
                        label="Post"
                        placeholder="Selecteer een post"
                        required
                        data={posts.map(post => ({ value: post, label: post }))}
                        value={formData.post}
                        onChange={(value) => handleChange('post', value || '')}
                        className="w-full"
                    />

                    <TextInput
                        label="IBAN"
                        placeholder="Je rekeningnummer"
                        value={formData.iban}
                        onChange={(e) => handleChange('iban', e.target.value)}
                        className="w-full"
                    />

                    <div className="flex justify-end mt-6">
                        <Button
                            color="vtk-yellow"
                            onClick={updateProfile}
                            loading={loading}
                            className="w-full sm:w-auto"
                        >
                            Profiel Opslaan
                        </Button>
                    </div>
                </div>
            </Box>
        </Paper>
    );
}
