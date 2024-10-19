import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../shared/interledger/infrastructure/client";
import { db } from "../../../shared/db";
import { Layout } from "../components/Layout";
import { Status } from "../components/Status";

export const handleInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const id = c.req.param("id");
  console.log(
    `[handleInteraction] for wallet ${id} and interaction reference ${interactRef}`
  );

  const data = await db.readData();
  const { outgoingPaymentGrant, incomingPayment, walletAddress } = data[id];
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
    data[id] = {
      ...data[id],
      accessToken: continuedGrant["access_token"].value,
      manageUrl: continuedGrant["access_token"].manage,
    };

    db.updateData(data);

    return c.render(
      <Layout>
          <Status status={outgoingPayment.failed ? 'Failed' : 'Success'}/>
      </Layout>
    );
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
