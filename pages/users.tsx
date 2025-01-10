import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext";
import { Profile } from "../types";
import { Button, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";

interface UsersProps {
    initialUsers: Profile[];
}

export default function Users({ initialUsers }: UsersProps) {
    const { user } = useUser();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>(initialUsers);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.admin) {
            router.push("/");
        }
    }, [router, user]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("profiles").select("*");
        if (error) {
            notifications.show({
                title: "Error",
                message: "Failed to fetch users",
            });
        } else {
            setUsers(data);
        }
        setLoading(false);
    };

    const updateUser = async (id: string, updates: Partial<Profile>) => {
        const { error } = await supabase.from("profiles").update(updates).eq("id", id);
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
            fetchUsers();
        }
    };

    const handleAdminToggle = (id: string, isAdmin: boolean) => {
        updateUser(id, { admin: isAdmin });
    };

    return (
        <div className="w-3/4 m-16">
            <h1 className="text-3xl font-bold border-b-8 border-vtk-yellow mb-10">
                Users
            </h1>
            <Table className="min-w-full">
                <thead className="border-b-4 border-vtk-yellow">
                    <tr>
                        <td><b>Name</b></td>
                        <td><b>Post</b></td>
                        <td><b>IBAN</b></td>
                        <td><b>Admin</b></td>
                        <td><b>Actions</b></td>
                    </tr>
                </thead>
                <tbody className="divide-y divide-vtk-yellow">
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.post}</td>
                            <td>{user.iban}</td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={user.admin ?? false}
                                    onChange={(e) => handleAdminToggle(user.id, e.target.checked)}
                                />
                            </td>
                            <td>
                                <Button onClick={() => router.push(`/editUser?id=${user.id}`)}>Edit</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {loading && <p>Loading...</p>}
        </div>
    );
}

export async function getServerSideProps() {
    const { data: users, error } = await supabase
        .from("profiles")
        .select("*")
        .order("admin", { ascending: false })
        .order("name", { ascending: true });

    if (error) {
        return {
            props: {
                initialUsers: [],
            },
        };
    }

    return {
        props: {
            initialUsers: users,
        },
    };
}