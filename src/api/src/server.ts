import { serve } from "@hono/node-server";

import app from "./app";
import { db } from "../../shared/db";

const port = 3000;

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Open Loan 🚀: Port ${info.port}`);
    const data = db.readData();
    console.log("DB", data);
  }
);
