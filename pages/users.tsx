import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from '../contexts/SupabaseContext';
import { Profile } from "../types";
import { Button, Table, Group, Modal } from "@mantine/core";
import { showNotification } from '@mantine/notifications';
import { createAdminClient } from '../lib/supabase';

interface UsersProps {
    initialUsers: Profile[];
}

export default function Users({ initialUsers }: UsersProps) {
    const user = useUser();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [adminToggleModalOpen, setAdminToggleModalOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<Profile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!loading && user && !user.admin) {
            router.push("/");
        }
    }, [router, user, loading]);

    const fetchUsers = async () => {
        setLoading(true);
        const supabase = createAdminClient();
        const { data, error } = await supabase.from("profiles").select("*");
        if (error) {
            showNotification({
                title: "Error",
                message: "Failed to fetch users",
            });
        } else {
            setUsers(data);
        }
        setLoading(false);
    };

    const updateUser = async (id: string, updates: Partial<Profile>) => {
        const supabase = createAdminClient();
        const { error } = await supabase.from("profiles").update(updates).eq("id", id);
        if (error) {
            showNotification({
                title: "Error",
                message: "Failed to update user",
            });
        } else {
            showNotification({
                title: "Success",
                message: "User updated successfully",
            });
            fetchUsers();
        }
    };

    const handleAdminToggle = (user: Profile, isAdmin: boolean) => {
        setUserToToggle(user);
        setIsAdmin(isAdmin);
        setAdminToggleModalOpen(true);
    };

    const confirmAdminToggle = async () => {
        if (userToToggle) {
            await updateUser(userToToggle.id, { admin: isAdmin });
            setAdminToggleModalOpen(false);
            fetchUsers();
        }
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
                                    onChange={(e) => handleAdminToggle(user, e.target.checked)}
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

            <Modal
                opened={adminToggleModalOpen}
                onClose={() => setAdminToggleModalOpen(false)}
                title={<strong>Edit Admin</strong>}
            >
                {userToToggle && (
                    <div>
                        <p>Are you sure you want to {isAdmin ? 'grant' : 'revoke'} admin privileges for the following user?</p>
                        <p><strong>Name:</strong> {userToToggle.name}</p>
                        <p><strong>Post:</strong> {userToToggle.post}</p>
                    </div>
                )}
                <Group position="apart" mt="md">
                    <Button onClick={() => setAdminToggleModalOpen(false)}>Cancel</Button>
                    <Button color={isAdmin ? 'green' : 'red'} onClick={confirmAdminToggle}>{isAdmin ? 'Grant' : 'Revoke'} Admin</Button>
                </Group>
            </Modal>
        </div>
    );
}

export async function getServerSideProps() {
    try {
        const supabase = createAdminClient();

        const { data: users, error } = await supabase
            .from("profiles")
            .select("*")
            .order("admin", { ascending: false })
            .order("name", { ascending: true });

        if (error) {
            console.error("Error fetching users:", error);
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
    } catch (error) {
        console.error("Users page error:", error);
        return {
            props: {
                initialUsers: [],
            },
        };
    }
}