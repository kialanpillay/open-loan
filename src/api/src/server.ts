import { serve } from "@hono/node-server";

import app from "./app";
import { db } from "../../shared/db";
import { getTransactions } from "../../shared/interledger/transactions";
import { recurringCollection } from "../../shared/interledger/collection/recurring";
import { sendPaymentNotificationToUser } from "./services/notifications";
import { Loan } from "../../chat-bot/src/services/types";

const port = 3000;
const POLLING_INTERVAL = 60000;

async function pollingJob() {
  const data = db.readData();
  const latestLoan: Loan = data.loans.sort(
    (a, b) => b.createAt - a.createAt
  )[0];

  if (
    latestLoan &&
    latestLoan?.grants?.transactionsAccessToken &&
    latestLoan.repaymentPlan
  ) {
    const debitAmount = await getTransactions(latestLoan.id);
    const response = await recurringCollection(debitAmount, latestLoan.id);

    if (!response.failed) {
      latestLoan.remaining -= debitAmount / 100;

      await sendPaymentNotificationToUser(
        latestLoan.userId,
        debitAmount,
        latestLoan.remaining
      );
      db.updateData(data);
    }
  }
}

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Open Loan 🚀: Port ${info.port}`);
    const data = db.readData();

    // Start the polling job
    setInterval(pollingJob, POLLING_INTERVAL);
  }
);
