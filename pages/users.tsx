import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSupabase } from '../contexts/SupabaseContext';
import { Profile } from "../types";
import { Button, Table, Group, Modal, Text, Loader, Tooltip } from "@mantine/core";
import { notifications } from '@mantine/notifications';

export default function Users() {
    const { user: currentUser, isLoading } = useSupabase();
    const router = useRouter();
    const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminToggleModalOpen, setAdminToggleModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToToggle, setUserToToggle] = useState<Profile | null>(null);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Improved redirect logic with delay to prevent premature redirects during page refresh
    useEffect(() => {
        // Clear any existing redirect timer when dependencies change
        if (redirectTimer) {
            clearTimeout(redirectTimer);
            setRedirectTimer(null);
        }

        // Only proceed if we've finished loading
        if (!isLoading) {
            if (currentUser === null) {
                // Set a small delay to give Supabase time to restore the session
                const timer = setTimeout(() => {
                    // Check again before redirecting
                    if (!document.hidden) { // Only redirect if page is visible
                        console.log("User not logged in after delay, redirecting to home");
                        router.push('/');
                    }
                }, 1000); // 1 second delay

                setRedirectTimer(timer);
            } else if (currentUser && currentUser.admin === false) {
                console.log("User is not an admin, redirecting to home");
                router.push('/');
            }
        }

        // Cleanup function to clear the timer if the component unmounts
        return () => {
            if (redirectTimer) {
                clearTimeout(redirectTimer);
            }
        };
    }, [isLoading, currentUser, router, redirectTimer]);

    // Fetch users on component mount
    useEffect(() => {
        if (!isLoading && currentUser?.admin) {
            fetchUsers();
        }
    }, [isLoading, currentUser]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/getUsers');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch users');
            }

            setUsers(result.users);
        } catch (error) {
            console.error("Error fetching users:", error);
            notifications.show({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to fetch users",
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdminToggle = (user: Profile, isAdmin: boolean) => {
        setUserToToggle(user);
        setIsAdmin(isAdmin);
        setAdminToggleModalOpen(true);
    };

    const confirmAdminToggle = async () => {
        if (!userToToggle) return;

        try {
            const response = await fetch('/api/toggleAdmin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userToToggle.id,
                    isAdmin: isAdmin,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update admin status');
            }

            notifications.show({
                title: "Success",
                message: `Admin privileges ${isAdmin ? 'granted' : 'revoked'} successfully`,
                color: "green",
            });

            setAdminToggleModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Error toggling admin:", error);
            notifications.show({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to update admin status",
                color: "red",
            });
        }
    };

    const handleDeleteUser = (user: Profile) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/deleteUser?id=${userToDelete.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }

            notifications.show({
                title: "Success",
                message: "User deleted successfully",
                color: "green",
            });

            setDeleteModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            notifications.show({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to delete user",
                color: "red",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    // If we get here and user is definitely not an admin, show loading while redirecting
    if (currentUser === null || (currentUser && currentUser.admin === false)) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader size="xl" color="vtk-yellow" />
            </div>
        );
    }

    return (
        <div className="w-3/4 m-16">
            <h1 className="text-3xl font-bold border-b-8 border-vtk-yellow mb-10">
                Users
            </h1>
            {loading ? (
                <div className="flex justify-center items-center min-h-[50vh]">
                    <Loader size="xl" color="vtk-yellow" />
                </div>
            ) : (
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
                                    <Group spacing="xs">
                                        <Button
                                            onClick={() => router.push(`/editUser?id=${user.id}`)}
                                            size="sm"
                                        >
                                            Edit
                                        </Button>
                                        {user.id !== currentUser?.id ? (
                                            <Button
                                                color="red"
                                                onClick={() => handleDeleteUser(user)}
                                                size="sm"
                                            >
                                                Delete
                                            </Button>
                                        ) : (
                                            <Tooltip
                                                label="For security reasons, you cannot delete your own account"
                                                position="top"
                                                withArrow
                                            >
                                                <div> {/* Wrapper div to make tooltip work with disabled button */}
                                                    <Button
                                                        color="gray"
                                                        size="sm"
                                                        disabled
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </Tooltip>
                                        )}
                                    </Group>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Admin Toggle Modal */}
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

            {/* Delete User Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={<strong>Delete User</strong>}
            >
                {userToDelete && (
                    <div>
                        <Text mb={15}>Are you sure you want to delete the following user?</Text>
                        <Text><strong>Name:</strong> {userToDelete.name}</Text>
                        <Text><strong>Post:</strong> {userToDelete.post}</Text>
                        <Text className="text-red-500 mt-4">Warning: This action cannot be undone.</Text>
                        <Text className="text-red-500">Users with bills cannot be deleted. Delete all user bills first.</Text>
                    </div>
                )}
                <Group position="apart" mt="md">
                    <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button
                        color="red"
                        onClick={confirmDeleteUser}
                        loading={deleteLoading}
                    >
                        Delete User
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}