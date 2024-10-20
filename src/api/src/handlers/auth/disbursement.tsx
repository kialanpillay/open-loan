import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
} from "../../../../chat-bot/src/services/loans";
import { OPEN_LOAN_WALLET_ADDRESS } from "../../../../shared/interledger/util/constants";

export const handleDisbursementInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const id = c.req.param("id");
  console.log(
    `[handleDisbursementInteraction] for loan ${id} and interaction reference ${interactRef}`
  );

  const loan = await getLoanByLoanId(id);

  const { outgoingPaymentGrant, incomingPayment } = loan.disbursementGrants;
  try {
    const client = await createOpenPaymentsClient();
    const continuedGrant: any = await client.grant.continue(
      {
        accessToken: outgoingPaymentGrant.continue.access_token.value,
        url: outgoingPaymentGrant.continue.uri,
      },
      {
        interact_ref: interactRef,
      }
    );

    const openLoanWalletAddress = await client.walletAddress.get({
      url: OPEN_LOAN_WALLET_ADDRESS,
    });

    const outgoingPayment = await client.outgoingPayment.create(
      {
        url: new URL(OPEN_LOAN_WALLET_ADDRESS).origin,
        accessToken: continuedGrant["access_token"].value,
      },
      {
        walletAddress: OPEN_LOAN_WALLET_ADDRESS,
        incomingPayment: incomingPayment.id,
        debitAmount: {
          value: "40", // Agreement Initiation Payment
          assetCode: openLoanWalletAddress.assetCode,
          assetScale: openLoanWalletAddress.assetScale,
        },
      }
    );

    return c.text(`Disbursement ${outgoingPayment.failed ? 'Failed' : 'Succeeded'}`, 201);
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
