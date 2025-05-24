import SignInForm from "./SignInForm";
import { Paper } from "@mantine/core";

export default function AuthUI() {
    return (
        <div className="w-full px-4 sm:px-6 py-4">
            <Paper shadow="sm" radius="md" className="w-full max-w-md mx-auto p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold border-b-4 border-vtk-yellow mb-6 pb-2">
                    Inloggen
                </h1>
                <SignInForm />
            </Paper>
        </div>
    );
}
