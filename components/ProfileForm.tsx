import { useState } from "react";
import { useSupabaseClient, Session } from "@supabase/auth-helpers-react";
import { notifications } from "@mantine/notifications";
import { Profile } from "../types";
import { useRouter } from "next/router";
import { useUser } from "../contexts/UserContext";
import { posts } from "../utils/constants";

export default function ProfileForm({ session }: { session: Session }) {
    const supabase = useSupabaseClient();
    let { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function updateProfile({
        name,
        iban,
        post,
    }: {
        name?: Profile["name"];
        iban?: Profile["iban"];
        post?: Profile["post"];
    }) {
        try {
            setLoading(true);
            if (!user) throw new Error("No user authenticated");

            const update_data = {
                id: user.id,
                name,
                post,
                iban,
                updated_at: new Date().toISOString(),
            };

            let { error } = await supabase.from("profiles").upsert(update_data);
            if (error) throw error;
            notifications.show({
                title: "Success",
                message: "Profile updated!"
            })
            router.push("/")
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Error while updating profile"
            })
        } finally {
            setLoading(false);
        }
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
                                    onChange={(e) => user!.name = e.target.value}
                                    value={user?.name ?? ""}
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
                                    onChange={(e) => user!.post = e.target.value}
                                    value={user!.post ?? ""}
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
                                    onChange={(e) => user!.iban = e.target.value}
                                    value={user!.iban ?? ""}
                                    className="border-b-2 border-slate-300"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <button
                    value="Opslaan"
                    className="border mt-9"
                    onClick={() => updateProfile({ name: user?.name, iban: user?.iban, post: user?.post })}
                    disabled={loading}
                >
                    Opslaan
                </button>
            </div>
        </div>
    );
}
