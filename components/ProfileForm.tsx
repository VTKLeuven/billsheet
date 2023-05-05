import { useState, useEffect } from "react";
import {
    useUser,
    useSupabaseClient,
    Session,
} from "@supabase/auth-helpers-react";
import { Profile } from "../types";
import { useRouter } from "next/router";

export default function ProfileForm({ session }: { session: Session }) {
    const supabase = useSupabaseClient();
    const user = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState<Profile["name"]>(null);
    const [iban, setIban] = useState<Profile["iban"]>(null);
    const [post, setPost] = useState<Profile["post"]>(null);

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

    useEffect(() => {
        getProfile();
    }, [session]);

    async function getProfile() {
        try {
            setLoading(true);
            if (!user) throw new Error("No user authenticated");
            let { data, error, status } = await supabase
                .from("profiles")
                .select()
                .eq("id", user.id)
                .single();
            if (error && status !== 406) throw error;
            if (data) {
                setName(data.name);
                setIban(data.iban);
                setPost(data.post);
            }
        } catch (error) {
            alert("Error loading user data");
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile({
        name,
        iban,
        post,
    }: {
        name: Profile["name"];
        iban: Profile["iban"];
        post: Profile["post"];
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
            alert("Profile updated!")
            router.push("/")
        } catch (error) {
            alert("Error while updating profile");
            console.log(error);
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
                                    onChange={(e) => setName(e.target.value)}
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
                                    onChange={(e) => setPost(e.target.value)}
                                    value={post ? post : ""}
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
                                    onChange={(e) => setIban(e.target.value)}
                                    className="border-b-2 border-slate-300"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <button
                    value="Opslaan"
                    className="border mt-9"
                    onClick={() => updateProfile({ name, iban, post })}
                    disabled={loading}
                >
                    Opslaan
                </button>
            </div>
        </div>
    );
}
