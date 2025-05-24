import { useRouter } from 'next/router';
import { useState, useRef, FormEvent } from 'react';
import { useUser } from '../contexts/SupabaseContext';
import { IBill } from '../types';
import { Button, TextInput, Select, NumberInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { posts } from '../utils/constants';
import { DatePickerInput } from '@mantine/dates';
import { createAdminClient } from '../lib/supabase';

export default function EditBill({ bill }: { bill: IBill }) {
    const user = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string | null>(bill.payment_method);

    // Create refs for all form fields
    const nameRef = useRef<HTMLInputElement>(null);
    const postRef = useRef<HTMLInputElement>(null);
    const [dateValue, setDateValue] = useState<Date | null>(bill.date ? new Date(bill.date) : null);
    const activityRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLInputElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);
    const ibanRef = useRef<HTMLInputElement>(null);

    if (!user?.admin) {
        return <p>Access Denied</p>
    }

    // Check if bill is already paid
    if (bill.paid) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 w-full max-w-md">
                    <p className="text-yellow-700">
                        This bill has already been marked as paid and cannot be edited.
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/admin')}
                    color="vtk-yellow.5"
                    className="bg-vtk-yellow h-[2em]"
                >
                    Back to Admin Page
                </Button>
            </div>
        );
    }

    const updateBill = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);

        function formatDate(dateValue: string | number | Date) {
            const date = new Date(dateValue);
            return date.getFullYear() + "-" +
                ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
                ("0" + date.getDate()).slice(-2);
        }

        try {
            // Use refs to safely access form values
            const amountValue = amountRef.current?.value || "0";

            // Prepare data to send to API
            const billData = {
                id: bill.id,
                name: nameRef.current?.value || "",
                post: postRef.current?.value || "",
                date: formatDate(dateValue || new Date()),
                activity: activityRef.current?.value || "",
                desc: descRef.current?.value || "",
                amount: Math.round(parseFloat(String(amountValue).replace(',', '.')) * 100),
                payment_method: paymentMethod || "vtk",
                iban: paymentMethod === 'personal' ? (ibanRef.current?.value || "") : "",
            };

            // Call the API endpoint
            const response = await fetch('/api/updateBill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(billData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update bill');
            }

            notifications.show({
                title: 'Success',
                message: 'Bill updated successfully',
            });

            router.push('/admin');
        } catch (error) {
            console.error("Error updating bill:", error);

            notifications.show({
                title: 'Error',
                message: error instanceof Error ? error.message : 'Failed to update bill',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!bill) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex justify-center align-center border-2 border-vtk-yellow rounded-lg p-4 sm:p-10">
            <form className="flex align-center flex-col w-full max-w-md space-y-2" onSubmit={updateBill}>
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">Edit Bill</h1>
                <TextInput
                    label="Name"
                    required
                    defaultValue={bill.name}
                    ref={nameRef}
                />
                <Select
                    label="Post"
                    data={posts}
                    required
                    defaultValue={bill.post}
                    onChange={(value) => {
                        if (postRef.current) {
                            postRef.current.value = value || "";
                        }
                    }}
                    ref={postRef}
                />
                <DatePickerInput
                    label="Datum Uitgave"
                    required
                    value={dateValue}
                    onChange={setDateValue}
                />
                <TextInput
                    label="Activity"
                    required
                    defaultValue={bill.activity}
                    ref={activityRef}
                />
                <TextInput
                    label="Description"
                    required
                    defaultValue={bill.desc}
                    ref={descRef}
                />
                <NumberInput
                    label="Amount"
                    required
                    defaultValue={bill.amount / 100}
                    inputMode="decimal"
                    min={0}
                    precision={2}
                    decimalSeparator=","
                    placeholder="10.23"
                    ref={amountRef}
                />
                <Select
                    label="Payment Method"
                    required
                    data={[
                        { value: 'vtk', label: 'VTK' },
                        { value: 'personal', label: 'Personal' },
                    ]}
                    defaultValue={bill.payment_method}
                    onChange={(value) => setPaymentMethod(value)}
                />
                {paymentMethod === 'personal' && (
                    <TextInput
                        label="IBAN"
                        required
                        defaultValue={bill.iban}
                        ref={ibanRef}
                    />
                )}
                <Button
                    color="vtk-yellow.5"
                    className="bg-vtk-yellow h-[2em]"
                    type="submit"
                    loading={loading}
                >
                    Update Bill
                </Button>
            </form>
        </div>
    );
}

export async function getServerSideProps(context: any) {
    const { id } = context.query;

    try {
        const supabase = createAdminClient();

        if (id) {
            const { data, error } = await supabase
                .from('bills')
                .select()
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching bill:", error);
                return {
                    notFound: true,
                };
            }

            return {
                props: { bill: data },
            };
        }

        return { notFound: true };
    } catch (error) {
        console.error("Edit bill page error:", error);
        return { notFound: true };
    }
}