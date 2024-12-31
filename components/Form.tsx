import { Alert, Button, FileInput, NumberInput, Select, TextInput, Loader } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { useUser } from "../contexts/UserContext";
import { posts } from "../utils/constants";


export default function Form() {
    const supabase = useSupabaseClient();
    const { user } = useUser();

    const [errorAlert, setErrorAlert] = useState("")
    const [successAlert, setSuccessAlert] = useState(false)
    const [loading, setLoading] = useState(false)

    const form: any = useForm({
        initialValues: {
            name: user?.name ?? "",
            post: user?.post,
            date: new Date(),
            activity: "",
            desc: "",
            amount: "",
            paymentMethod: "vtk",
            iban: user?.iban ?? "",
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

    useEffect(() => {
        const updateForm = () => {
            form.setValues({
                name: user?.name ?? "",
                post: user?.post ?? "",
                iban: user?.iban ?? "",
            })
        }
        if (user) {
            updateForm()
        }
    }, [user]);

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
            return
        }


        if (user == null) {
            setErrorAlert("Je bent niet ingelogd")
            setSuccessAlert(false)
            return
        }

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
            })
        setLoading(false)
        if (!error) {
            setSuccessAlert(true)
            setErrorAlert("")
            form.reset()
        } else {
            setErrorAlert(error.message)
            setSuccessAlert(false)
        }
    }

    async function uploadPhoto(file: File) {
        const uuid = v4()
        const extension = file.name.split(".").at(-1)
        const fileName = uuid + "." + extension
        const { data, error } = await
            supabase
                .storage
                .from('bill_images')
                .upload(fileName, file)
        if (error) {
        } else {
            return fileName
        }
    }

    function formatDate(timestamp: number) {
        const date = new Date(timestamp)
        return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2)
    }


    return (
        <div className="flex justify-center align-center rounded-lg p-10 min-w-[25em]">
            <form
                className="flex align-center flex-col min-w-[25em]"
            >
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">
                    Rekeningenblad
                </h1>

                <div className="flex flex-col space-y-4 justify-center content-center">
                    <TextInput label="Naam" withAsterisk {...form.getInputProps("name")} />
                    <Select label="Post" data={posts} withAsterisk {...form.getInputProps("post")} />
                    <DatePickerInput label="Datum Uitgave" withAsterisk {...form.getInputProps("date")} />
                    <TextInput label="Activiteit" withAsterisk {...form.getInputProps("activity")} />
                    <TextInput label="Omschrijving" withAsterisk {...form.getInputProps("desc")} />
                    <NumberInput label="Bedrag" min={0} precision={2} placeholder="10.23" withAsterisk {...form.getInputProps("amount")} />
                    <Select label="Betaalmethode" withAsterisk defaultValue="vtk"
                        data={[{ value: "vtk", label: "Kaart VTK" },
                        { value: "personal", label: "Persoonlijk" }]}
                        {...form.getInputProps("paymentMethod")}
                    />
                    {form.values.paymentMethod === "personal" ?
                        <TextInput label="IBAN" withAsterisk {...form.getInputProps("iban")} />
                        : <></>}
                    <FileInput
                        placeholder="Selecteer afbeelding"
                        label="Foto rekening"
                        withAsterisk
                        {...form.getInputProps("photo")}
                    />
                    {successAlert ?
                        <Alert title="Succesvol!" color="green">
                            Rekening succesvol ingediend!
                        </Alert> : <></>
                    }
                    {errorAlert ?
                        <Alert title="Error" color="red">
                            {errorAlert}
                        </Alert> : <></>
                    }

                    <Button color="vtk-yellow" onClick={sendBill}>{loading ? <Loader /> : "Verzenden"}</Button>
                </div>
            </form>
        </div>
    );
}
