import path from "path";
import { db } from "../../db";
import { createOpenPaymentsClient } from "../infrastructure/client";
import { CUSTOMER_WALLET_ADDRESS } from "../util/constants";

export async function recurringCollection(walletAddress: string) {
  const customerId = walletAddress.substring(
    walletAddress.lastIndexOf("/") + 1
  );

  const data = db.readData();
  const {
    incomingPayment,
    accessToken,
    manageUrl,
    totalAmount,
    agreementType,
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

  let debitAmount: number = -1;
  if (agreementType === "FIXED") {
    debitAmount = (totalAmount as number) / 10;
  } else {
    const customerWalletAddress = await client.walletAddress.get({
      url: CUSTOMER_WALLET_ADDRESS,
    });

    const incomingPaymentGrant: any = await client.grant.request(
      {
        url: customerWalletAddress.authServer,
      },
      {
        access_token: {
          access: [
            {
              type: "incoming-payment",
              actions: ["list", "read", "read-all"],
            },
          ],
        },
      }
    );

    console.log({
      walletAddress: CUSTOMER_WALLET_ADDRESS,
      url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
      accessToken: incomingPaymentGrant["access_token"].value,
    });
    const incomingPayments = await client.incomingPayment.list({
      walletAddress: CUSTOMER_WALLET_ADDRESS,
      url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
      accessToken: incomingPaymentGrant["access_token"].value,
    });
    console.log(incomingPayments);
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
  }

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
