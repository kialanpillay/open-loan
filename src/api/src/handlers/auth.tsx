import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
  updateLoanGrants,
} from "../../../chat-bot/src/services/loans";
import { Layout } from "../components/Layout";
import { Status } from "../components/Status";
import { sendLoanOutcomeToUser } from "../services/notifications";

export const handleInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const id = c.req.param("id");
  console.log(
    `[handleInteraction] for loan ${id} and interaction reference ${interactRef}`
  );

  const loan = await getLoanByLoanId(id);

  const { outgoingPaymentGrant, incomingPayment, walletAddress } = loan.grants;
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

    const customerWalletAddress = await client.walletAddress.get({
      url: walletAddress,
    });

    const outgoingPayment = await client.outgoingPayment.create(
      {
        url: new URL(walletAddress).origin,
        accessToken: continuedGrant["access_token"].value,
      },
      {
        walletAddress: walletAddress,
        incomingPayment: incomingPayment.id,
        debitAmount: {
          value: "100", // Agreement Initiation Payment
          assetCode: customerWalletAddress.assetCode,
          assetScale: customerWalletAddress.assetScale,
        },
      }
    );
    updateLoanGrants(id, {
      accessToken: continuedGrant["access_token"].value,
      manageUrl: continuedGrant["access_token"].manage,
    });

    // Send loan outcome to the user
    await sendLoanOutcomeToUser(loan.userId, loan.id);

    return c.render(
      <Layout>
        <Status status={outgoingPayment.failed ? "Failed" : "Success"} />
      </Layout>
    );
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
