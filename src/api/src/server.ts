import { serve } from "@hono/node-server";

import app from "./app";
import { db } from "../../shared/db";

const port = 3000;
const POLLING_INTERVAL = 1000;

function pollingJob() {
  console.log("Running polling job...");
  // Add your polling logic here
  // For example, you could check for updates in the database
  const data = db.readData();
  console.log("Current data:", data);
  // Perform any necessary operations with the data
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
