import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
  updateLoanGrants,
} from "../../../../chat-bot/src/services/loans";
import { Layout } from "../../components/Layout";
import { Status } from "../../components/Status";

const sendLoanOutcomeToUser = async (chatId: number, loanId: string) => {
  const outcomeMessage =
    "<b>Your loan application was successful. ✅</b>\n\n You can repay using one of the following plans:\n\n• <b>Fixed Plan</b>: Fixed repayments at regular intervals.\n\n• <b>Variable Plan</b>: A percentage of all incoming deposits will be taken as repayment.\n\nPick the option that works for you!";

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Fixed",
            callback_data: `fixed_repayments_${loanId}`,
          },
          {
            text: "Variable",
            callback_data: `variable_repayments_${loanId}`,
          },
        ],
      ],
    },
    parse_mode: "HTML",
  };

  const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: outcomeMessage,
      ...options,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send message to Telegram:", response.statusText);
  }
};

export const handleTransactionsInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const id = c.req.param("id");
  console.log(
    `[handleInteraction] for loan ${id} and interaction reference ${interactRef}`
  );

  const loan = await getLoanByLoanId(id);

  const { userIncomingPaymentsGrant, walletAddress } = loan.grants;
  try {
    const client = await createOpenPaymentsClient();
    const continuedGrant: any = await client.grant.continue(
      {
        accessToken: '8C06FF2AE4409092B0F6', // userIncomingPaymentsGrant.continue.access_token.value
        url: 'https://auth.interledger-test.dev/continue/0def4f39-9891-413a-87fc-a6e156dd1dc7' //userIncomingPaymentsGrant.continue.uri,
      },
      {
        interact_ref: interactRef,
      }
    );

    updateLoanGrants(id, {
      transactionsAccessToken: continuedGrant["access_token"].value,
      transactionsManageUrl: continuedGrant["access_token"].manage,
    });

    await sendLoanOutcomeToUser(loan.userId, loan.id);

    return c.render(
      <Layout>
        <Status status={"Success"} />
      </Layout>
    );
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
