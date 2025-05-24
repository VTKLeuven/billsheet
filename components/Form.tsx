import { Alert, Button, FileInput, NumberInput, Select, TextInput, Loader, Box, Paper } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { useSupabase, useSupabaseClient, useUser } from "../contexts/SupabaseContext";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { posts } from "../utils/constants";

export default function Form() {
    const supabase = useSupabaseClient();
    const { user, isLoading } = useSupabase();

    const [errorAlert, setErrorAlert] = useState("")
    const [successAlert, setSuccessAlert] = useState(false)
    const [loading, setLoading] = useState(false)
    const [initialValuesSet, setInitialValuesSet] = useState(false);

    const form: any = useForm({
        initialValues: {
            name: "",
            post: "",
            date: new Date(),
            activity: "",
            desc: "",
            amount: "",
            paymentMethod: "vtk",
            iban: "",
            photo: undefined
        },
        validate: {
            name: isNotEmpty("Dit veld is verplicht"),
            post: isNotEmpty("Dit veld is verplicht"),
            date: isNotEmpty("Dit veld is verplicht"),
            activity: isNotEmpty("Dit veld is verplicht"),
            desc: isNotEmpty("Dit veld is verplicht"),
            paymentMethod: isNotEmpty("Dit veld is verplicht"),
            amount: isNotEmpty("Dit veld is verplicht"),
            iban: (value) => (form.values.paymentMethod === "personal" && value.length < 1 ? "Dit veld is verplicht" : null),
            photo: (value: File | undefined) => (
                value === undefined
                    ? "Dit veld is verplicht"
                    : !isAllowedExtension(value.name)
                        ? "Enkel .png, .jpg, .jpeg en .pdf bestanden zijn toegelaten"
                        : null),
        }
    });

    // Effect to set initial values only once after user data is loaded
    useEffect(() => {
        // Only set initial values if user data is loaded and we haven't set them yet
        if (user && !isLoading && !initialValuesSet) {
            form.setFieldValue("name", user.name || "");
            form.setFieldValue("post", user.post || "");
            form.setFieldValue("iban", user.iban || "");
            setInitialValuesSet(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading, initialValuesSet]);

    function isAllowedExtension(name: string) {
        const lowerName = name.toLowerCase();
        return lowerName.endsWith("pdf") || lowerName.endsWith("jpg") || lowerName.endsWith("jpeg") || lowerName.endsWith("png");
    }

    async function sendBill() {
        const validated = form.validate();

        if (validated && validated.hasErrors) {
            return;
        }

        setLoading(true)
        const values = form.values
        const path = await uploadPhoto(values.photo)

        if (!path) {
            setLoading(false);
            return;
        }

        if (user == null) {
            setErrorAlert("Je bent niet ingelogd")
            setSuccessAlert(false)
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('bills')
                .insert({
                    name: values.name,
                    post: values.post,
                    activity: values.activity,
                    desc: values.desc,
                    date: formatDate(values.date),
                    amount: Math.round(values.amount * 100),
                    payment_method: values.paymentMethod,
                    iban: values.iban,
                    image: path,
                    uid: user.id
                });

            if (!error) {
                setSuccessAlert(true)
                setErrorAlert("")

                // Reset form but preserve user-specific fields
                const userValues = {
                    name: values.name,
                    post: values.post,
                    iban: values.iban
                };

                form.reset();

                // Restore user-specific values
                form.setFieldValue("name", userValues.name);
                form.setFieldValue("post", userValues.post);
                form.setFieldValue("iban", userValues.iban);
                form.setFieldValue("paymentMethod", "vtk");
            } else {
                setErrorAlert(error.message)
                setSuccessAlert(false)
            }
        } catch (error: any) {
            setErrorAlert(error.message || "Er is een fout opgetreden")
            setSuccessAlert(false)
        } finally {
            setLoading(false)
        }
    }

    async function uploadPhoto(file: File) {
        if (!file) return null;

        try {
            const uuid = v4()
            const extension = file.name.split(".").at(-1)
            const fileName = uuid + "." + extension
            const { data, error } = await supabase
                .storage
                .from('bill_images')
                .upload(fileName, file)

            if (error) {
                console.error("Error uploading file:", error)
                setErrorAlert("Fout bij uploaden van bestand: " + error.message)
                return null
            } else {
                return fileName
            }
        } catch (error: any) {
            console.error("Error uploading file:", error)
            setErrorAlert("Fout bij uploaden van bestand")
            return null
        }
    }

    function formatDate(timestamp: number) {
        const date = new Date(timestamp)
        return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2)
    }

    // Show loading indicator while user data is being fetched
    if (isLoading) {
        return (
            <Paper shadow="xs" radius="md" className="w-full mx-auto">
                <Box className="p-4 sm:p-6 md:p-8 flex justify-center items-center" style={{ minHeight: "300px" }}>
                    <Loader size="xl" color="vtk-yellow" />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper shadow="xs" radius="md" className="w-full mx-auto">
            <Box className="p-4 sm:p-6 md:p-8">
                <form className="w-full">
                    <h1 className="text-2xl md:text-3xl font-bold border-b-4 border-vtk-yellow mb-6 pb-2">
                        Rekeningenblad
                    </h1>

                    <div className="flex flex-col space-y-4">
                        {/* First row - potentially paired on larger screens */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput
                                label="Naam"
                                withAsterisk
                                {...form.getInputProps("name")}
                                className="w-full"
                            />
                            <Select
                                label="Post"
                                data={posts}
                                withAsterisk
                                {...form.getInputProps("post")}
                                className="w-full"
                            />
                        </div>

                        {/* Second row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DatePickerInput
                                label="Datum Uitgave"
                                withAsterisk
                                {...form.getInputProps("date")}
                                className="w-full"
                            />
                            <TextInput
                                label="Activiteit"
                                withAsterisk
                                {...form.getInputProps("activity")}
                                className="w-full"
                            />
                        </div>

                        {/* Description - full width */}
                        <TextInput
                            label="Omschrijving"
                            withAsterisk
                            {...form.getInputProps("desc")}
                            className="w-full"
                        />

                        {/* Third row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NumberInput
                                label="Bedrag"
                                inputMode="decimal"
                                min={0}
                                precision={2}
                                decimalSeparator=","
                                placeholder="10.23"
                                withAsterisk
                                {...form.getInputProps("amount")}
                                className="w-full"
                            />
                            <Select
                                label="Betaalmethode"
                                withAsterisk
                                defaultValue="vtk"
                                data={[
                                    { value: "vtk", label: "Kaart VTK" },
                                    { value: "personal", label: "Persoonlijk" }
                                ]}
                                {...form.getInputProps("paymentMethod")}
                                className="w-full"
                            />
                        </div>

                        {/* IBAN - conditionally shown */}
                        {form.values.paymentMethod === "personal" && (
                            <TextInput
                                label="IBAN"
                                withAsterisk
                                {...form.getInputProps("iban")}
                                className="w-full"
                            />
                        )}

                        {/* File input - full width */}
                        <FileInput
                            placeholder="Selecteer afbeelding"
                            label="Foto rekening"
                            withAsterisk
                            {...form.getInputProps("photo")}
                            className="w-full"
                        />

                        {/* Alerts */}
                        {successAlert && (
                            <Alert title="Succesvol!" color="green" className="mt-4">
                                Rekening succesvol ingediend!
                            </Alert>
                        )}

                        {errorAlert && (
                            <Alert title="Error" color="red" className="mt-4">
                                {errorAlert}
                            </Alert>
                        )}

                        {/* Submit button */}
                        <Button
                            color="vtk-yellow"
                            onClick={sendBill}
                            fullWidth
                            size="md"
                            className="mt-6"
                        >
                            {loading ? <Loader size="sm" /> : "Verzenden"}
                        </Button>
                    </div>
                </form>
            </Box>
        </Paper>
    );
}
