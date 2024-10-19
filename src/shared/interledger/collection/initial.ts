import { v4 } from "uuid";
import { createOpenPaymentsClient } from "../infrastructure/client";
import { OPEN_LOAN_WALLET_ADDRESS, BASE_URL } from "../util/constants";

export async function initialCollection(
  loanId: string,
  totalAmount: number,
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

  const userIncomingPaymentsGrant: any = await client.grant.request(
    {
      url: customerWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            identifier: customerWalletAddress.id,
            type: "incoming-payment",
            actions: ["list", "list-all"],
          },
        ],
      },
      interact: {
        start: ["redirect"],
        finish: {
          method: "redirect",
          uri: `${BASE_URL}/auth/transactions/${loanId}`,
          nonce: v4(),
        },
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
          uri: `${BASE_URL}/auth/${loanId}`,
          nonce: v4(),
        },
      },
    }
  );

  return {
    incomingPayment,
    outgoingPaymentGrant,
    totalAmount,
    walletAddress,
    customerId,
    userIncomingPaymentsGrant,
  };
}
