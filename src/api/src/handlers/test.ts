import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../shared/interledger/infrastructure/client";
import { db } from "../../../shared/db";
import { v4 } from "uuid";

export const handleTest = async (c: Context) => {
    const body = await c.req.json();
    const customerId = body.walletAddress.substring(
        body.walletAddress.lastIndexOf("/") + 1
      );
      const client = await createOpenPaymentsClient();
      const customerWalletAddress = await client.walletAddress.get({
        url: body.walletAddress,
      });
      console.log(customerWalletAddress)
    
      const userIncomingPaymentsGrant: any = await client.grant.request(
        {
          url: customerWalletAddress.authServer,
        },
        {
          access_token: {
            access: [
              {
                type: "incoming-payment",
                actions: ["list", "list-all"],
                identifier: customerWalletAddress.id,
              },
            ],
          },
          interact: {
            start: ["redirect"],
            finish: {
              method: "redirect",
              uri: `http://localhost:3000/auth/transactions/e765b80d-81bc-4ac8-adec-75e895546ef9`,
              nonce: v4(),
            },
          },
        }
      );
      console.log(userIncomingPaymentsGrant)
  
      return c.json({})
}
