import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
} from "../../../../chat-bot/src/services/loans";
import { OPEN_LOAN_WALLET_ADDRESS } from "../../../../shared/interledger/util/constants";
import { AccountFlags, id } from 'tigerbeetle-node'
import { createTigerBeetleClient } from "../../../../shared/tigerbeetle/client";

export const handleDisbursementInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const loanId = c.req.param("id");
  console.log(
    `[handleDisbursementInteraction] for loan ${loanId} and interaction reference ${interactRef}`
  );

  const loan = await getLoanByLoanId(loanId);

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
          value: incomingPayment.incomingAmount.value,
          assetCode: openLoanWalletAddress.assetCode,
          assetScale: openLoanWalletAddress.assetScale,
        },
      }
    );

    if (!outgoingPayment.failed) {
      const client = createTigerBeetleClient();
      const accounts = await client.lookupAccounts([1n]);
      if (accounts.length === 0) {
        const account = {
          id: 1n, 
          debits_pending: 0n,
          debits_posted: 0n,
          credits_pending: 0n,
          credits_posted: 0n,
          user_data_128: 0n,
          user_data_64: 0n,
          user_data_32: 0,
          reserved: 0,
          ledger: 1,
          code: 718,
          flags: AccountFlags.history,
          timestamp: 0n,
        };
        await client.createAccounts([account]);
      }

      const transfers = [{
        id: id(), 
        debit_account_id: 1n,
        credit_account_id: BigInt(loan.userId),
        amount: BigInt(loan.principal),
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

      client.createTransfers(transfers)
    }

    return c.text(`Disbursement ${outgoingPayment.failed ? 'Failed' : 'Succeeded'}`, 201);
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
