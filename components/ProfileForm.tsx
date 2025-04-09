import { useState } from "react";
import { useSupabase } from "../contexts/SupabaseContext";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { posts } from "../utils/constants";

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
                message: "Profile updated!"
            });
            router.push("/");
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Error while updating profile"
            });
        } finally {
            setLoading(false);
        }
    }

    if (!user) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="flex justify-center align-center border-2 border-vtk-yellow rounded-lg p-10 ">
            <div className="flex align-center flex-col" id="form">
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">
                    Profile
                </h1>
                <table className="border-spacing">
                    <tbody>
                        <tr>
                            <td className="py-2">
                                <label htmlFor="name" className="p-3">
                                    Naam
                                </label>
                            </td>
                            <td className="py-2 pl-10">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    value={formData.name}
                                    required
                                    className="border-b-2 border-slate-300"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2">
                                <label htmlFor="post" className="p-3">
                                    Post
                                </label>
                            </td>
                            <td className="py-2 pl-10">
                                <select
                                    id="post"
                                    name="post"
                                    required
                                    className="border-b-2 border-slate-300 background-white"
                                    onChange={(e) => handleChange('post', e.target.value)}
                                    value={formData.post}
                                >
                                    {posts.map((postOption: string) => (
                                        <option
                                            key={postOption}
                                            value={postOption}
                                        >
                                            {postOption}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td className="py-2">
                                <label htmlFor="iban" className="p-3">
                                    IBAN
                                </label>
                            </td>
                            <td className="py-2 pl-10">
                                <input
                                    id="iban"
                                    name="iban"
                                    type="text"
                                    onChange={(e) => handleChange('iban', e.target.value)}
                                    value={formData.iban}
                                    className="border-b-2 border-slate-300"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <button
                    value="Opslaan"
                    className="border mt-9"
                    onClick={updateProfile}
                    disabled={loading}
                >
                    Opslaan
                </button>
            </div>
        </div>
    );
}
