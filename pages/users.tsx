import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext";
import { Profile } from "../types";
import { Button, Table, Group, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { showNotification } from '@mantine/notifications';

interface UsersProps {
    initialUsers: Profile[];
}

export default function Users({ initialUsers }: UsersProps) {
    const { user } = useUser();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

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

    const deleteUser = async (id: string) => {
        const { error } = await supabase.from("profiles").delete().eq("id", id);
        if (error) {
            notifications.show({
                title: "Error",
                message: "Failed to delete user",
            });
        } else {
            notifications.show({
                title: "Success",
                message: "User deleted successfully",
            });
            setUsers(users.filter(user => user.id !== id));
        }
    };

    const handleDeleteClick = (user: Profile) => {
        if (user.admin) {
            showNotification({
                title: 'Error',
                message: 'Admin users cannot be deleted.',
                color: 'red',
            });
            return;
        }
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
        }
        setDeleteModalOpen(false);
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
                                <Group spacing="xs">
                                    <Button onClick={() => router.push(`/editUser?id=${user.id}`)}>Edit</Button>
                                    <Button color="red" onClick={() => handleDeleteClick(user)}>Delete</Button>
                                </Group>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {loading && <p>Loading...</p>}

            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={<strong>Confirm Deletion</strong>}
            >
                {userToDelete && (
                    <div>
                        <p>Are you sure you want to delete the following user?</p>
                        <p><strong>Name:</strong> {userToDelete.name}</p>
                        <p><strong>Post:</strong> {userToDelete.post}</p>
                    </div>
                )}
                <Group position="apart" mt="md">
                    <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={confirmDelete}>Delete</Button>
                </Group>
            </Modal>
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