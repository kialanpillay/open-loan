import { db } from "../db";
import { createOpenPaymentsClient } from "./infrastructure/client";

export async function getTransactions(walletAddress: string): Promise<number> {
  const customerId = walletAddress.substring(
    walletAddress.lastIndexOf("/") + 1
  );

  const data = db.readData();
  const {
    totalAmount,
    transactionsAccessToken
  } = data[customerId];
  const client = await createOpenPaymentsClient();

    let debitAmount: number = -1;
    try {
        const incomingPayments = await client.incomingPayment.list({
            walletAddress,
            url: new URL(walletAddress).origin,
            accessToken: transactionsAccessToken,
        });
    
        const transactions = incomingPayments.result.sort(
            (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
        );
        while (debitAmount === -1 && transactions.length > 0) {
            const txn = transactions[0];
            if (txn.receivedAmount && Number(txn.receivedAmount.value) > 0) {
                debitAmount = 0.1 * Number(txn.receivedAmount.value);
                break;
            }
        }
        // If no transactions, revert to fixed schedule
        if ((debitAmount = -1)) {
            debitAmount = (totalAmount as number) / 10;
        }
    } catch (error) {
        console.error(error),
        debitAmount = (totalAmount as number) / 10;
    }
    
  return debitAmount;
}
