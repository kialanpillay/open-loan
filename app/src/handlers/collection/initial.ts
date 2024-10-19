import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../../infrastructure/client'
import { BASE_URL, CUSTOMER_WALLET_ADDRESS, OPEN_LOAN_WALLET_ADDRESS } from '../../util/constants';
import { v4 } from 'uuid';
import { db } from '../../app'

export const handleInitialCollection = async (c: Context) => {
    const body = await c.req.parseBody();
    const amount = Number(body.amount) * 100
    const agreementType = body.agreementType as 'FIXED' | 'VARIABLE'
    
    console.log("[collection/initial] handling request", body)
    try {
        const client = await createOpenPaymentsClient();
        const openLoanWalletAddress = await client.walletAddress.get({
            url: OPEN_LOAN_WALLET_ADDRESS,
        });
        const customerWalletAddress = await client.walletAddress.get({
            url: CUSTOMER_WALLET_ADDRESS,
        });
        const customerId = customerWalletAddress.id.substring(customerWalletAddress.id.lastIndexOf("/") + 1)
    
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
                value: "100", // USD1 initiation payment
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
                  uri: `${BASE_URL}/auth/${customerId}`,
                  nonce: v4(),
                },
              },
            },
          );
          db[customerId] = {
            grant: outgoingPaymentGrant,
            quote,
            totalAmount: amount,
            agreementType,
            accessToken: outgoingPaymentGrant['access_token'].value,
            manageUrl: outgoingPaymentGrant['access_token'].url,
          }
          console.log(outgoingPaymentGrant)

          return c.json({
            redirect: outgoingPaymentGrant['interact'].redirect
          })
    }
    catch (error) {
        console.log(error)
        return c.text(`Internal Server Error. ${error}`, 500)
    }

};
