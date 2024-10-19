import path from "path";
import { db } from "../../db";
import { createOpenPaymentsClient } from "../infrastructure/client";
import { CUSTOMER_WALLET_ADDRESS } from "../util/constants";

export async function recurringCollection(walletAddress: string, debitAmount: number) {
  const customerId = walletAddress.substring(
    walletAddress.lastIndexOf("/") + 1
  );

  const data = db.readData();
  const {
    incomingPayment,
    accessToken,
    manageUrl,
  } = data[customerId];
  const client = await createOpenPaymentsClient();
  const customerWalletAddress = await client.walletAddress.get({
    url: CUSTOMER_WALLET_ADDRESS,
  });

  const token = await client.token.rotate({
    url: manageUrl as string,
    accessToken: accessToken as string,
  });

  data[customerId] = {
    ...data[customerId],
    accessToken: token.access_token.value,
    manageUrl: token.access_token.manage,
  };
  db.updateData(data);

  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
      accessToken: token.access_token.value,
    },
    {
      walletAddress: CUSTOMER_WALLET_ADDRESS,
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
