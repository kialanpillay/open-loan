import { v4 } from "uuid";
import { createOpenPaymentsClient } from "../infrastructure/client";
import {
  OPEN_LOAN_WALLET_ADDRESS,
  CUSTOMER_WALLET_ADDRESS,
  BASE_URL,
} from "../util/constants";
import { db } from "../../db";

export async function initialCollection(
  totalAmount: number,
  initialPayment: number,
  walletAddress: string
) {
  const client = await createOpenPaymentsClient();
  const openLoanWalletAddress = await client.walletAddress.get({
    url: OPEN_LOAN_WALLET_ADDRESS,
  });
  const customerWalletAddress = await client.walletAddress.get({
    url: walletAddress,
  });
  const customerId = customerWalletAddress.id.substring(
    customerWalletAddress.id.lastIndexOf("/") + 1
  );

  const incomingPaymentGrant: any = await client.grant.request(
    {
      url: openLoanWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            type: "incoming-payment",
            actions: ["list", "read", "read-all", "complete", "create"],
          },
        ],
      },
    }
  );

  const incomingPayment = await client.incomingPayment.create(
    {
      url: new URL(OPEN_LOAN_WALLET_ADDRESS).origin,
      accessToken: incomingPaymentGrant["access_token"].value,
    },
    {
      walletAddress: OPEN_LOAN_WALLET_ADDRESS,
      incomingAmount: {
        value: totalAmount.toString(), // Agreement Total
        assetCode: openLoanWalletAddress.assetCode,
        assetScale: openLoanWalletAddress.assetScale,
      },
      expiresAt: new Date(Date.now() + 60_000 * 10).toISOString(),
    }
  );

  const outgoingPaymentGrant: any = await client.grant.request(
    {
      url: customerWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            identifier: customerWalletAddress.id,
            type: "outgoing-payment",
            actions: ["list", "list-all", "read", "read-all", "create"],
          },
        ],
      },
      interact: {
        start: ["redirect"],
        finish: {
          method: "redirect",
          uri: `${BASE_URL}/auth/${customerId}`,
          nonce: v4(),
        },
      },
    }
  );

  const data = db.readData();
  data[customerId] = {
    incomingPayment,
    outgoingPaymentGrant,
    totalAmount,
    walletAddress,
  };
  db.updateData(data);

  return {
    redirect: outgoingPaymentGrant["interact"].redirect,
    customerId,
  };
}
