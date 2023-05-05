import { Alert, Button, FileInput, Select, TextInput } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { isNotEmpty, useForm } from "@mantine/form";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { v4 } from "uuid";
import { Profile } from "../types";


export default function Form({ profile }: { profile: Profile }) {
    const supabase = useSupabaseClient();
    const [errorAlert, setErrorAlert] = useState(false)
    const [succesAlert, setSuccessAlert] = useState(false)

    const form = useForm({
        initialValues: {
            name: "",
            post: "",
            date: Date.now(),
            activity: "",
            desc: "",
            amount: 0,
            paymentMethod: "vtk",
            iban: "",
            photo: new File([""], "Selecteer bestand")
        },
        validate: {
            email: isNotEmpty("Dit veld is verplicht"),
            post: isNotEmpty("Dit veld is verplicht"),
            date: isNotEmpty("Dit veld is verplicht"),
            activity: isNotEmpty("Dit veld is verplicht"),
            desc: isNotEmpty("Dit veld is verplicht"),
            paymentMethod: isNotEmpty("Dit veld is verplicht"),
            amount: isNotEmpty("Dit veld is verplicht"),
            iban: (value) => ( form.values.paymentMethod === "personal" && value.length < 1 ? "Dit veld is verplicht" : null ),
            photo: (value) => ( value.name == "Selecteer bestand" ? "Dit veld is verplicht" : null ),
        }
    });

    const posts = [
        "Activiteiten",
        "Bedrijvenrelaties",
        "Communicatie",
        "Cultuur",
        "Cursusdienst",
        "Development",
        "Fakbar",
        "G5",
        "Internationaal",
        "IT",
        "Logistiek",
        "Onderwijs",
        "Sport",
        "Theokot",
    ];

    async function sendBill() {
        if (!form.validate()) {
            console.log(form.errors)
            console.log("Form is not valid");
            return
        }
        const values = form.values
        const path = await uploadPhoto(values.photo)

        if (!path) {
            return
        }

        const user = await supabase.auth.getUser()

        if (!user.data.user) {
            setErrorAlert(true)
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
                amount: Math.round(values.amount*100),
                payment_method: values.paymentMethod,
                iban: values.iban,
                image: path,
                uid: user.data.user.id
            })
        if (!error) {
            setSuccessAlert(true)
            setErrorAlert(false)
            form.reset()
        } else {
            setErrorAlert(true)
            setSuccessAlert(false)
        }
    }

    async function uploadPhoto(file: File) {
        const uuid = v4()
        const extension = file.name.split(".").at(-1)
        const fileName = uuid + "." + extension
        console.log(fileName)
        const { data, error } = await
            supabase
                .storage
                .from('bill_images')
                .upload(fileName, file)
        if (error) {
            console.log(data, error)
        } else {
            return fileName
        }
    }
    
    function formatDate(timestamp: number) {
        const date = new Date(timestamp)
        return date.getFullYear() + "-" + ("0" + date.getMonth() + 1).slice(-2) + "-" + ("0" + date.getDate()).slice(-2)
    }


    return (
        <div className="flex justify-center align-center rounded-lg p-10 min-w-[50%]">
            <form
                className="flex align-center flex-col"
            >
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">
                    Rekeningenblad
                </h1>

                <div className="flex flex-col space-y-4 justify-center content-center">
                    <TextInput label="Naam" withAsterisk {...form.getInputProps("name")} />
                    <Select label="Post" data={posts} withAsterisk {...form.getInputProps("post")} />
                    <DatePicker label="Datum Uitgave" withAsterisk defaultValue={Date.now()} {...form.getInputProps("date")} />
                    <TextInput label="Activiteit" withAsterisk {...form.getInputProps("activity")} />
                    <TextInput label="Omschrijving" withAsterisk {...form.getInputProps("desc")} />
                    <TextInput type="number" placeholer="69,00" label="Bedrag" withAsterisk {...form.getInputProps("amount")} />
                    <Select label="Betaalmethode" withAsterisk defaultValue="vtk"
                        data={[{ value: "vtk", label: "Kaart VTK" },
                        { value: "personal", label: "Persoonlijk" }]}
                        {...form.getInputProps("paymentMethod")}
                    />
                    { form.values.paymentMethod === "personal" ?
                        <TextInput label="IBAN" withAsterisk {...form.getInputProps("iban")}/>
                        : <></> }
                    <FileInput
                        placeholder="Selecteer afbeelding"
                        label="Foto rekening"
                        withAsterisk
                        {...form.getInputProps("photo")}
                    />
                    { succesAlert ? 
                        <Alert title="Succesvol!" color="green">
                            Rekening succesvol ingediend!
                        </Alert> : <></> 
                        }
                    { errorAlert ? 
                        <Alert title="Error" color="red">
                            Er ging iets mis, probeer later opnieuw
                        </Alert> : <></> 
                        }

                    <Button color="vtk-yellow" onClick={sendBill}>Verzenden</Button>
                </div>
            </form>
        </div>
    );
}
