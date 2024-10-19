import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
  updateLoanGrants,
} from "../../../../chat-bot/src/services/loans";
import { Layout } from "../../components/Layout";
import { Status } from "../../components/Status";

const sendMessage = async (chatId: number, loanId: string) => {
  const loan = await getLoanByLoanId(loanId);
  const message = `<b>One more step! ⏳</b>\n\nOpen Loan requires access to your transaction history:\n\n${loan.grants.userIncomingPaymentsGrant["interact"].redirect}`;

  const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send message to Telegram:", response.statusText);
  }
};

export const handlePaymentInteraction = async (c: Context) => {
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

    await sendMessage(loan.userId, loan.id);

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
