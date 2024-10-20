import { v4 } from "uuid";
import { createOpenPaymentsClient } from "../infrastructure/client";
import { OPEN_LOAN_WALLET_ADDRESS, BASE_URL } from "../util/constants";

export async function initiateDisbursement(
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

  const incomingPaymentGrant: any = await client.grant.request(
    {
      url: customerWalletAddress.authServer,
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
      url: new URL(walletAddress).origin,
      accessToken: incomingPaymentGrant["access_token"].value,
    },
    {
      walletAddress: walletAddress,
      incomingAmount: {
        value: totalAmount.toString(), // Loan Total
        assetCode: customerWalletAddress.assetCode,
        assetScale: customerWalletAddress.assetScale,
      },
    }
  );

  const outgoingPaymentGrant: any = await client.grant.request(
    {
      url: openLoanWalletAddress.authServer,
    },
    {
      access_token: {
        access: [
          {
            identifier: openLoanWalletAddress.id,
            type: "outgoing-payment",
            actions: ["read", "read-all", "create"],
          },
        ],
      },
      interact: {
        start: ["redirect"],
        finish: {
          method: "redirect",
          uri: `${BASE_URL}/auth/internal/${loanId}`,
          nonce: v4(),
        },
      },
    }
  );

  return {
    incomingPayment,
    outgoingPaymentGrant,
  }
}
