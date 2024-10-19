import { getLoanByLoanId } from "../../../chat-bot/src/services/loans";

export async function sendLoanOutcomeToUser(chatId: number, loanId: string) {
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
}

export async function sendTransactionAuthorisationRequest(
  chatId: number,
  loanId: string
) {
  const loan = await getLoanByLoanId(loanId);
  const outcomeMessage = `<b>One more step!</b>\n\nOpen Loan requires access to your transaction history.\n\n${loan.grants.userIncomingPaymentsGrant["interact"].redirect}`;

  const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: outcomeMessage,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    console.error("Failed to send message to Telegram:", response.statusText);
  }
}

export async function sendPaymentNotificationToUser(
  chatId: number,
  repaymentAmount: number,
  remaining: number
) {
  const message = `<b>Loan Repayment Received</b>\n\nWe received $${
    repaymentAmount / 100
  } from you!\n\nYou still need to repay $${remaining}`;

  const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    console.error("Failed to send message to Telegram:", response.statusText);
  }
}
