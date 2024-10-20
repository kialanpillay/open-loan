import { getLoanByLoanId } from "../../chat-bot/src/services/loans";
import { createOpenPaymentsClient } from "./infrastructure/client";

export async function getTransactions(loanId: string): Promise<number> {
  const loan = await getLoanByLoanId(loanId);

  const { transactionsAccessToken, walletAddress } = loan.grants;
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

    if (transactions.length > 0) {
      const txn = transactions[0];
      debitAmount = Math.round(0.1 * Number(txn.receivedAmount.value));
      return debitAmount;
    }

    // If no transactions, revert to fixed schedule
    if ((debitAmount = -1)) {
      debitAmount = Math.round(loan.principal * (1 + loan.interestRate) * 10);
    }
  } catch (error) {
    console.error(error);
  }

  return debitAmount;
}
