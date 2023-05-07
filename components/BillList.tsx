import { Table } from "@mantine/core";
import { IBill } from "../types";
import BillListItem from "./BillListItem";

interface IBillList {
    billList: [IBill];
}

export default function BillList({ billList }: IBillList) {
    return (
        <div className="w-3/4 m-16">
            <h1 className="text-3xl font-bold border-b-8 border-vtk-yellow mb-10">
                Overview
            </h1>
            <Table className="min-w-full ">
                <thead className="border-b-4 border-vtk-yellow">
                    <tr>
                        <td>
                            <b>Omschrijving</b>
                        </td>
                        <td>
                            <b>Event</b>
                        </td>
                        <td>
                            <b>Naam</b>
                        </td>
                        <td>
                            <b>Datum</b>
                        </td>
                        <td>
                            <b>Bedrag</b>
                        </td>
                        <td>
                            <b>Betaald</b>
                        </td>
                    </tr>
                </thead>
                <tbody className="divide-y divide-vtk-yellow">
                    {billList.map((bill: IBill) => (
                        <BillListItem key={bill.id} bill={bill} />
                    ))}
                </tbody>
            </Table>
        </div>
    );
}
