import { useRouter } from 'next/router';
import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabaseClient';
import { IBill } from '../types';
import { Button, TextInput, Textarea, Select, NumberInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { posts } from '../utils/constants';
import { DatePickerInput } from '@mantine/dates';

export default function EditBill({ bill }: { bill: IBill }) {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    if (!user?.admin) {
        return <p>Access Denied</p>
    }

    const updateBill = async (event: any) => {
        event.preventDefault();
        setLoading(true);

        function formatDate(timestamp: number) {
            const date = new Date(timestamp)
            return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2)
        }

        const { error } = await supabase
            .from('bills')
            .update({
                name: event.target.name.value,
                post: event.target.post.value,
                date: formatDate(event.target.date.value),
                activity: event.target.activity.value,
                desc: event.target.desc.value,
                amount: Math.round(event.target.amount.value.replace(',', '.') * 100),
                payment_method: event.target.paymentMethod.value,
                iban: event.target.iban.value,
            })
            .eq('id', bill.id);

        setLoading(false);

        if (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update bill',
            });
        } else {
            notifications.show({
                title: 'Success',
                message: 'Bill updated successfully',
            });
            router.push('/admin');
        }
    };

    if (!bill) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex justify-center align-center border-2 border-vtk-yellow rounded-lg p-10">
            <form className="flex align-center flex-col min-w-[25em]" onSubmit={updateBill}>
                <h1 className="text-3xl font-bold border-b-4 border-vtk-yellow m-6">Edit Bill</h1>
                <TextInput label="Name" required name="name" defaultValue={bill.name} />
                <Select label="Post" data={posts} name="post" required defaultValue={bill.post} />
                <DatePickerInput label="Datum Uitgave" name="date" required defaultValue={new Date(bill.date ?? Date.now())} />
                <TextInput label="Activity" required name="activity" defaultValue={bill.activity} />
                <TextInput label="Description" required name="desc" defaultValue={bill.desc} />
                <NumberInput label="Amount" required name="amount" defaultValue={bill.amount / 100} inputMode="decimal" min={0} precision={2} decimalSeparator="," placeholder="10.23" />
                <Select
                    label="Payment Method"
                    required
                    name="paymentMethod"
                    data={[
                        { value: 'vtk', label: 'VTK' },
                        { value: 'personal', label: 'Personal' },
                    ]}
                    defaultValue={bill.payment_method}
                />
                <TextInput label="IBAN" required name="iban" defaultValue={bill.iban} />
                <Button color="vtk-yellow.5" className="bg-vtk-yellow h-[2em] m-5" type="submit" loading={loading}>
                    Update Bill
                </Button>
            </form>
        </div>
    );
}

export async function getServerSideProps(context: any) {
    const { id } = context.query;
    if (id) {
        const { data, error } = await supabase
            .from('bills')
            .select()
            .eq('id', id)
            .single();

        if (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to fetch bill data',
            });
        }

        return {
            props: { bill: data },
        };
    }
}