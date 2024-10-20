import { db } from "../../db";
import { createOpenPaymentsClient } from "../infrastructure/client";

import { getLoanByLoanId } from "../../../chat-bot/src/services/loans";
import { createTigerBeetleClient } from "../../tigerbeetle/client";
import { id } from "tigerbeetle-node";

export async function recurringCollection(debitAmount: number, loanId: string) {
  console.log(
    `[${recurringCollection.name}] initiating recurring payment for ${
      debitAmount / 100
    }`
  );
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
  const loanData = data["loans"].find((loan) => loan.id === loanId);
  loanData.grants.accessToken = token.access_token.value;
  loanData.grants.manageUrl = token.access_token.manage;
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

  if (!outgoingPayment.failed) {
    const tigerBeetleClient = createTigerBeetleClient();
    const transfers = [{
      id: id(), 
      debit_account_id: BigInt(loan.userId),
      credit_account_id: 1n,
      amount: BigInt(debitAmount / 100),
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
      ledger: 1,
      code: 720,
      flags: 0,
      timestamp: 0n,
    }];
    tigerBeetleClient.createTransfers(transfers)
  }
  
  return outgoingPayment;
}
