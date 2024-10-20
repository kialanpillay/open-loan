import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
  updateLoanGrants,
} from "../../../../chat-bot/src/services/loans";
import { Layout } from "../../components/Layout";
import { Status } from "../../components/Status";
import { sendTransactionAuthorisationRequest } from "../../services/notifications";
import { createTigerBeetleClient } from "../../../../shared/tigerbeetle/client";
import { id } from "tigerbeetle-node";

export const handlePaymentInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const loanId = c.req.param("id");
  console.log(
    `[handlePaymentInteraction] for loan ${loanId} and interaction reference ${interactRef}`
  );

  const loan = await getLoanByLoanId(loanId);

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
          value: "40", // Agreement Initiation Payment
          assetCode: customerWalletAddress.assetCode,
          assetScale: customerWalletAddress.assetScale,
        },
      }
    );
    updateLoanGrants(loanId, {
      accessToken: continuedGrant["access_token"].value,
      manageUrl: continuedGrant["access_token"].manage,
    });

    if (!outgoingPayment.failed) {
      const tigerBeetleClient = createTigerBeetleClient();
      const transfers = [{
        id: id(), 
        debit_account_id: BigInt(loan.userId),
        credit_account_id: 1n,
        amount: BigInt(40 / 100),
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

    await sendTransactionAuthorisationRequest(loan.userId, loan.id);

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
