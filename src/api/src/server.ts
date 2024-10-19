import { serve } from "@hono/node-server";

import app from "./app";
import { db } from "../../shared/db";
import { getTransactions } from "../../shared/interledger/transactions";
import { recurringCollection } from "../../shared/interledger/collection/recurring";

const port = 3000;
const POLLING_INTERVAL = 1000;

async function pollingJob() {
  const data = db.readData();
  const latestLoan = data.loans.sort((a, b) => b.createAt - a.createAt)[0];

  if (latestLoan && latestLoan?.grants?.transactionsAccessToken) {
    const debitAmount = await getTransactions(latestLoan.Id);
    await recurringCollection(debitAmount, latestLoan.id);
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
