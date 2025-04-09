import SignInForm from "./SignInForm";

export default function AuthUI() {
    return (
        <div>
            <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6 min-w-1/4">
                Inloggen
            </h1>
            <SignInForm />
        </div>
    );
}
