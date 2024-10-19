import { db } from "../../db";
import { createOpenPaymentsClient } from "../infrastructure/client";

import { getLoanByLoanId } from "../../../chat-bot/src/services/loans";

export async function recurringCollection(debitAmount: number, loanId: string) {
  const loan = await getLoanByLoanId(loanId);
  const { incomingPayment, accessToken, manageUrl, walletAddress } =
    loan.grants;
  const client = await createOpenPaymentsClient();
  const customerWalletAddress = await client.walletAddress.get({
    url: walletAddress,
  });

  const token = await client.token.rotate({
    url: manageUrl as string,
    accessToken: accessToken as string,
  });

  const data = db.readData();
  loan.grants.accessToken = token.access_token.value;
  loan.grants.manageUrl = token.access_token.manage;
  db.updateData(data);

  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: new URL(walletAddress).origin,
      accessToken: token.access_token.value,
    },
    {
      walletAddress: walletAddress,
      incomingPayment: incomingPayment.id as string,
      debitAmount: {
        value: debitAmount.toString(),
        assetCode: customerWalletAddress.assetCode,
        assetScale: customerWalletAddress.assetScale,
      },
    }
  );
  return outgoingPayment;
}
