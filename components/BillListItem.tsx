import { Checkbox } from "@mantine/core";
import { IBill } from "../types";
import { AiOutlineDownload } from "react-icons/ai"
import { useState } from "react";

interface IBillListItem {
    bill: IBill;
}

export default function BillListItem({ bill }: IBillListItem) {
    const [paid, setPaid] = useState(bill.paid);

    async function handlePaidChange(e: any) {
        setPaid(e.target.checked);
        fetch("/api/setPaid", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: bill.id,
                paid: e.target.checked,
            }),
        });
    }
    return (
        <tr>
            <td>
                <h2 className="text-l"> {bill.desc} </h2>
            </td>
            <td>
                {bill.activity}
            </td>
            <td>
                {bill.name}
            </td>
            <td>
                {bill.date}
            </td>
            <td>
                € { bill.amount ? <>{(bill.amount / 100).toFixed(2)}</>: "0.00"} 
            </td>
            <td>
                <Checkbox checked={paid} onChange={handlePaidChange}/>
            </td>
            <td>
                <a href={`/api/downloadReport?id=${bill.id}`} target="_blank" rel="noreferrer" download>
                    <AiOutlineDownload/>
                </a>
            </td>
        </tr>
    );
}
