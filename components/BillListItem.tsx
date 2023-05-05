import { IBill } from "../types";
import { AiOutlineDownload } from "react-icons/ai"

interface IBillListItem {
    bill: IBill;
}

export default function BillListItem({ bill }: IBillListItem) {
    async function downloadBill() {
        const pdf = await fetch("/downloadReport?id=" + bill.id)
        console.log(pdf)
    }
    return (
        <tr>
            <td>
                <h2 className="text-l"> {bill.desc} </h2>
            </td>
            <td>
                {bill.name}
            </td>
            <td>
                {bill.date}
            </td>
            <td>
                { bill.amount ? <>{Math.floor(bill.amount/100) },{bill.amount % 100}</>: "0,00"} 
            </td>
            <td>
                <AiOutlineDownload onClick={downloadBill}/>
            </td>
        </tr>
    );
}
