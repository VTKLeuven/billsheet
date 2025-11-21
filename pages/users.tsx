import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSupabase } from '../contexts/SupabaseContext';
import { Profile } from "../types";
import { Button, Table, Group, Modal, Text, Loader, Tooltip, Paper, Box, MediaQuery, Badge, Card, Pagination, Select } from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { FiEdit, FiTrash2, FiUser, FiCheck, FiX } from "react-icons/fi";
import { posts } from '../utils/constants';


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

    const [postAdminModalOpen, setPostAdminModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<Profile | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

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

    const handlePostAdminChange = (user: Profile) => {
        const latestUser = users.find(u => u.id === user.id) || user;
        setUserToEdit({ ...latestUser });
        setPostAdminModalOpen(true);
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

    // Get current users for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);

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
        <>
            <div className="flex flex-col w-full px-4 py-6 md:py-10 md:px-6">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-vtk-yellow pb-2">
                            Users Management
                        </h1>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center min-h-[30vh]">
                            <Loader size="xl" color="vtk-yellow" />
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <MediaQuery largerThan="md" styles={{ display: 'none' }}>
                                <div className="space-y-4">
                                    {currentUsers.map((user) => (
                                        <Card key={user.id} shadow="sm" padding="lg" radius="md" withBorder className="border-l-4 border-vtk-yellow">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <Text weight={700} size="lg">{user.name}</Text>
                                                    {user.admin ? (
                                                        <Badge color="blue" variant="filled">Admin</Badge>
                                                    ) : null}
                                                </div>

                                                <div className="py-2">
                                                    <Text size="sm" color="dimmed">Post:</Text>
                                                    <Text>{user.post || "-"}</Text>

                                                    <Text size="sm" color="dimmed" mt={8}>IBAN:</Text>
                                                    <Text>{user.iban || "-"}</Text>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                    <Text size="sm" weight={500}>Admin Access:</Text>
                                                    <Button
                                                        variant={user.admin ? "filled" : "outline"}
                                                        color={user.admin ? "blue" : "gray"}
                                                        size="xs"
                                                        onClick={() => handleAdminToggle(user, !user.admin)}
                                                        leftIcon={user.admin ? <FiCheck size={16} /> : <FiX size={16} />}
                                                        className="min-w-[90px]"
                                                    >
                                                        {user.admin ? "Yes" : "No"}
                                                    </Button>
                                                </div>

                                                <div className="flex space-x-2 mt-4 pt-2 border-t border-gray-200">
                                                    <Button
                                                        variant="outline"
                                                        leftIcon={<FiEdit size={16} />}
                                                        onClick={() => router.push(`/edit-user?id=${user.id}`)}
                                                        className="flex-1"
                                                    >
                                                        Edit
                                                    </Button>

                                                    {user.id !== currentUser?.id ? (
                                                        <Button
                                                            variant="outline"
                                                            color="red"
                                                            leftIcon={<FiTrash2 size={16} />}
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="flex-1"
                                                        >
                                                            Delete
                                                        </Button>
                                                    ) : (
                                                        <Tooltip
                                                            label="For security reasons, you cannot delete your own account"
                                                            position="top"
                                                            withArrow
                                                        >
                                                            <div className="flex-1">
                                                                <Button
                                                                    variant="outline"
                                                                    color="gray"
                                                                    leftIcon={<FiTrash2 size={16} />}
                                                                    disabled
                                                                    className="w-full"
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    {/* Pagination for mobile */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={totalPages}
                                                value={currentPage}
                                                onChange={setCurrentPage}
                                                size="sm"
                                                radius="md"
                                                withEdges
                                                color="blue"
                                            />
                                        </div>
                                    )}
                                </div>
                            </MediaQuery>

                            {/* Desktop Table View */}
                            <MediaQuery smallerThan="md" styles={{ display: 'none' }}>
                                <Box className="overflow-x-auto">
                                    <Table className="min-w-full">
                                        <thead className="border-b-4 border-vtk-yellow">
                                            <tr>
                                                <th><b>Name</b></th>
                                                <th><b>Post</b></th>
                                                <th><b>IBAN</b></th>
                                                <th><b>Admin</b></th>
                                                <th><b>Post Admin</b></th>
                                                <th><b>Actions</b></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {currentUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.post || "-"}</td>
                                                    <td>{user.iban || "-"}</td>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={user.admin ?? false}
                                                            onChange={(e) => handleAdminToggle(user, e.target.checked)}
                                                            className="h-5 w-5"
                                                        />
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline"
                                                            size="xs"
                                                            onClick={() => handlePostAdminChange(user)}
                                                        >
                                                            {user.allowed_posts || 'None'}
                                                        </Button>
                                                    </td>
                                                    <td>
                                                        <Group spacing="xs">
                                                            <Button
                                                                variant="outline"
                                                                leftIcon={<FiEdit size={16} />}
                                                                onClick={() => router.push(`/edit-user?id=${user.id}`)}
                                                                size="sm"
                                                            >
                                                                Edit
                                                            </Button>
                                                            {user.id !== currentUser?.id ? (
                                                                <Button
                                                                    variant="outline"
                                                                    color="red"
                                                                    leftIcon={<FiTrash2 size={16} />}
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
                                                                    <div>
                                                                        <Button
                                                                            variant="outline"
                                                                            color="gray"
                                                                            leftIcon={<FiTrash2 size={16} />}
                                                                            disabled
                                                                            size="sm"
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

                                    {/* Pagination for desktop */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination
                                                total={totalPages}
                                                value={currentPage}
                                                onChange={setCurrentPage}
                                                size="md"
                                                radius="md"
                                                withEdges
                                                color="blue"
                                            />
                                        </div>
                                    )}
                                </Box>
                            </MediaQuery>

                            {/* User count summary */}
                            <Text size="sm" color="dimmed" align="center" mt={4} mb={6}>
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, users.length)} of {users.length} users
                            </Text>

                            {/* Mobile action button */}
                            <div className="md:hidden mt-4 flex justify-center">
                                <Button
                                    leftIcon={<FiUser size={16} />}
                                    onClick={() => router.push('/account')}
                                    fullWidth
                                >
                                    Your Account
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Admin Toggle Modal */}
            <Modal
                opened={adminToggleModalOpen}
                onClose={() => setAdminToggleModalOpen(false)}
                title={<Text weight={700}>Edit Admin Privileges</Text>}
                centered
                size="sm"
            >
                {userToToggle && (
                    <div className="space-y-3">
                        <Text>Are you sure you want to {isAdmin ? 'grant' : 'revoke'} admin privileges for the following user?</Text>
                        <Paper p="sm" withBorder>
                            <Text><strong>Name:</strong> {userToToggle.name}</Text>
                            <Text><strong>Post:</strong> {userToToggle.post || "-"}</Text>
                        </Paper>
                    </div>
                )}
                <Group position="apart" mt="xl">
                    <Button variant="outline" onClick={() => setAdminToggleModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color={isAdmin ? 'green' : 'red'}
                        onClick={confirmAdminToggle}
                    >
                        {isAdmin ? 'Grant' : 'Revoke'} Admin
                    </Button>
                </Group>
            </Modal>
            {/* Admin Lite Toggle */}
            <Modal
                opened={postAdminModalOpen}
                onClose={() => setPostAdminModalOpen(false)}
                title={`Set post for ${userToEdit?.name}`}
                centered
                size="lg"
                styles={{
                    body: {
                        minHeight: '400px', // adjust as needed
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    },
                }}
            >
                <Select
                    label="Post"
                    placeholder="Select post"
                    data={[{ value: '', label: 'None' }, ...posts.map(post => ({ value: post, label: post }))]}
                    value={userToEdit?.post || ''}
                    onChange={(val) => {
                        if (userToEdit) setUserToEdit({ ...userToEdit, post: val || null });
                    }}
                    clearable
                />

                <Group position="apart" mt="xl">
                    <Button variant="outline" onClick={() => setPostAdminModalOpen(false)}>Cancel</Button>
                    <Button
                        color="vtk-yellow"
                        onClick={async () => {
                            if (!userToEdit) return;
                            try {
                                const response = await fetch('/api/updateUser', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        id: userToEdit.id,
                                        allowed_posts: userToEdit.post || null,
                                    }),
                                });
                                const result = await response.json();
                                if (!response.ok) throw new Error(result.error || 'Failed to update post');
                                notifications.show({
                                    title: 'Success',
                                    message: 'User post updated successfully',
                                    color: 'green',
                                });
                                setUsers(prev =>
                                    prev.map(u =>
                                        u.id === userToEdit.id ? { ...u, allowed_posts: userToEdit.post || null } : u
                                    )
                                );
                                setPostAdminModalOpen(false);
                            } catch (error) {
                                notifications.show({
                                    title: 'Error',
                                    message: error instanceof Error ? error.message : 'Failed to update post',
                                    color: 'red',
                                });
                            }
                        }}
                    >
                        Save
                    </Button>
                </Group>
            </Modal>



            {/* Delete User Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={<Text weight={700}>Delete User</Text>}
                centered
                size="sm"
            >
                {userToDelete && (
                    <div className="space-y-3">
                        <Text>Are you sure you want to delete the following user?</Text>
                        <Paper p="sm" withBorder>
                            <Text><strong>Name:</strong> {userToDelete.name}</Text>
                            <Text><strong>Post:</strong> {userToDelete.post || "-"}</Text>
                        </Paper>
                        <Text className="text-red-500 font-medium">Warning: This action cannot be undone.</Text>
                        <Text className="text-red-500 text-sm">Users with bills cannot be deleted. Delete all user bills first.</Text>
                    </div>
                )}
                <Group position="apart" mt="xl">
                    <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={confirmDeleteUser}
                        loading={deleteLoading}
                    >
                        Delete User
                    </Button>
                </Group>
            </Modal>
        </>
    );
}