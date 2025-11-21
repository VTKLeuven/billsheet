import React, { useState } from "react";
import { useRouter } from "next/router";
import { useUser, useSupabaseClient } from "../contexts/SupabaseContext";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { Burger, Drawer, Group, MediaQuery, Stack, Divider, Box, Button } from "@mantine/core";
import { IoLogOutOutline } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";

export default function NavBar() {
    const router = useRouter();
    const user = useUser();
    const supabase = useSupabaseClient();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    let regularLinks = new Map();
    regularLinks.set("Home", "/");

    if (user) {
        regularLinks.set("My Bills", "/my-bills");
    }

    let adminLinks = new Map();
    if (user?.admin || (user?.allowed_posts != null)) {
        adminLinks.set("All Bills", "/admin");
        adminLinks.set("Users", "/users");
    }

    async function logOut() {
        const { error } = await supabase.auth.signOut();
        notifications.show({
            title: "Logged out",
            message: "You have been logged out",
        });
        router.push("/");
        setMobileMenuOpen(false);
    }

    const isActive = (path: string) => router.pathname === path;

    const goToProfile = () => {
        router.push("/account");
        setMobileMenuOpen(false);
    };

    return (
        <>
            {/* Desktop Navbar */}
            <MediaQuery smallerThan="md" styles={{ display: 'none' }}>
                <nav className="bg-slate-100 border-b-4 border-vtk-yellow shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="flex items-center">
                                    <Link href="/">
                                        <span className="font-bold text-xl text-gray-800">BillSheet</span>
                                    </Link>
                                </div>

                                <div className="ml-10 flex items-center space-x-4">
                                    {Array.from(regularLinks).map(([name, path]) => (
                                        <Link key={name} href={path}>
                                            <div className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors ${isActive(path) ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                                                }`}>
                                                {name}
                                            </div>
                                        </Link>
                                    ))}

                                    {(user?.admin|| (user?.allowed_posts != null)) && (
                                        <>
                                            <div className="h-6 border-l border-gray-300"></div>
                                            {Array.from(adminLinks).map(([name, path]) => (
                                                <Link key={name} href={path}>
                                                    <div className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors ${isActive(path) ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                        {name}
                                                    </div>
                                                </Link>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {user && (
                                <div className="flex items-center">
                                    <div className="flex items-center">
                                        <div
                                            className={`flex items-center mr-4 px-3 py-2 rounded-md cursor-pointer ${isActive("/account") ? 'bg-gray-200' : 'hover:bg-gray-200'
                                                } transition-colors`}
                                            onClick={goToProfile}
                                        >
                                            <FaUserCircle className="h-8 w-8 text-gray-400" />
                                            <span className="ml-2 text-sm font-medium text-gray-700">
                                                {user.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={logOut}
                                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center"
                                        >
                                            <IoLogOutOutline className="mr-1 h-5 w-5" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </MediaQuery>

            {/* Mobile Navbar */}
            <MediaQuery largerThan="md" styles={{ display: 'none' }}>
                <nav className="bg-slate-100 border-b-4 border-vtk-yellow shadow-sm">
                    <div className="px-4 h-14 flex items-center justify-between">
                        <Link href="/">
                            <span className="font-bold text-xl text-gray-800">BillSheet</span>
                        </Link>

                        <Burger
                            opened={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            size="sm"
                        />
                    </div>

                    {/* Mobile Menu Drawer */}
                    <Drawer
                        opened={mobileMenuOpen}
                        onClose={() => setMobileMenuOpen(false)}
                        padding="xl"
                        size="xs"
                        position="right"
                        title={
                            user ? (
                                <Group
                                    spacing="sm"
                                    className={`p-2 rounded-md cursor-pointer ${isActive("/account") ? 'bg-gray-100' : 'hover:bg-gray-50'
                                        }`}
                                    onClick={goToProfile}
                                >
                                    <FaUserCircle className="h-6 w-6 text-gray-400" />
                                    <span className="font-medium text-gray-700">
                                        {user.name}
                                    </span>
                                </Group>
                            ) : (
                                "Menu"
                            )
                        }
                    >
                        <Stack spacing="xs">
                            {Array.from(regularLinks).map(([name, path]) => (
                                <Box
                                    key={name}
                                    component={Link}
                                    href={path}
                                    className={`block py-2 px-3 rounded-md ${isActive(path)
                                        ? 'bg-gray-100 text-gray-900 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {name}
                                </Box>
                            ))}

                            {user?.admin && (
                                <>
                                    <Divider my="sm" label="Admin" labelPosition="center" />
                                    {Array.from(adminLinks).map(([name, path]) => (
                                        <Box
                                            key={name}
                                            component={Link}
                                            href={path}
                                            className={`block py-2 px-3 rounded-md ${isActive(path)
                                                ? 'bg-gray-100 text-gray-900 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {name}
                                        </Box>
                                    ))}
                                </>
                            )}

                            {user && (
                                <>
                                    <Divider my="sm" />
                                    <Button
                                        variant="subtle"
                                        color="red"
                                        onClick={logOut}
                                        leftIcon={<IoLogOutOutline />}
                                        fullWidth
                                    >
                                        Logout
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Drawer>
                </nav>
            </MediaQuery>
        </>
    );
}
