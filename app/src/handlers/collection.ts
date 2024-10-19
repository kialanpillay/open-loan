import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../infrastructure/client'
import { BASE_URL, CUSTOMER_WALLET_ADDRESS, OPEN_LOAN_WALLET_ADDRESS } from '../util/constants';
import { v4 } from 'uuid';
import { db } from '../app'

export const handleCollection = async (c: Context) => {
    console.log("[handleCollection]")
    try {
        const client = await createOpenPaymentsClient();
        const openLoanWalletAddress = await client.walletAddress.get({
            url: OPEN_LOAN_WALLET_ADDRESS,
        });
        const customerWalletAddress = await client.walletAddress.get({
            url: CUSTOMER_WALLET_ADDRESS,
        });
    
        const incomingPaymentGrant: any = await client.grant.request(
            {
              url: openLoanWalletAddress.authServer,
            },
            {
              access_token: {
                access: [
                  {
                    type: "incoming-payment",
                    actions: ["list", "read", "read-all", "complete", "create"],
                  },
                ],
              },
            },
          );
        
        const incomingPayment = await client.incomingPayment.create(
        {
            url: new URL(OPEN_LOAN_WALLET_ADDRESS).origin,
            accessToken: incomingPaymentGrant['access_token'].value,
        },
        {
            walletAddress: OPEN_LOAN_WALLET_ADDRESS,
            incomingAmount: {
                value: "1",
                assetCode: "USD",
                assetScale: 2,
            },
            expiresAt: new Date(Date.now() + 60_000 * 10).toISOString(),
        },
        );
    
        const quoteGrant: any = await client.grant.request(
            {
              url: customerWalletAddress.authServer,
            },
            {
              access_token: {
                access: [
                  {
                    type: "quote",
                    actions: ["create", "read", "read-all"],
                  },
                ],
              },
            },
          );
    
          const quote = await client.quote.create(
            {
              url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
              accessToken: quoteGrant['access_token'].value,
            },
            {
              method: "ilp",
              walletAddress: CUSTOMER_WALLET_ADDRESS,
              receiver: incomingPayment.id,
            },
          );
    
          const outgoingPaymentGrant: any = await client.grant.request(
            {
              url: customerWalletAddress.authServer,
            },
            {
              access_token: {
                access: [
                  {
                    identifier: customerWalletAddress.id,
                    type: "outgoing-payment",
                    actions: ["list", "list-all", "read", "read-all", "create"],
                    limits: {
                      debitAmount: quote.debitAmount,
                      receiveAmount: quote.receiveAmount,
                    },
                  },
                ],
              },
              interact: {
                start: ["redirect"],
                finish: {
                  method: "redirect",
                  uri: `${BASE_URL}/auth/${customerWalletAddress.id}`,
                  nonce: v4(),
                },
              },
            },
          );
          db[outgoingPaymentGrant['interact'].finish as string] = {
            grant: outgoingPaymentGrant,
            quote,
          }


          c.json({
            redirect: outgoingPaymentGrant['interact'].redirect
          })
    }
    catch (error) {
        console.log(error)
        c.text(`Internal Server Error. ${error}`, 500)
    }

};
