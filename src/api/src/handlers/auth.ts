import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../shared/interledger/infrastructure/client";
import { db } from "../../../shared/db";

export const handleInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const id = c.req.param("id");
  console.log(
    `[handleInteraction] for wallet ${id} and interaction reference ${interactRef}`
  );

  const data = await db.readData();
  const { outgoingPaymentGrant, quote } = data[id];
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

    const outgoingPayment = await client.outgoingPayment.create(
      {
        url: new URL(`https://ilp.interledger-test.dev/${id}`).origin,
        accessToken: continuedGrant["access_token"].value,
      },
      {
        walletAddress: `https://ilp.interledger-test.dev/${id}`,
        quoteId: quote.id,
      }
    );
    data[id] = {
      ...data[id],
      accessToken: continuedGrant["access_token"].value,
      manageUrl: continuedGrant["access_token"].manage,
    };
    db.updateData(data);

    return c.json(outgoingPayment, 200);
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
