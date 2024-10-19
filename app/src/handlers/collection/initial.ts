import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../../infrastructure/client'
import { BASE_URL, CUSTOMER_WALLET_ADDRESS, OPEN_LOAN_WALLET_ADDRESS } from '../../util/constants';
import { v4 } from 'uuid';
import { db } from '../../server'
import * as fs from 'fs';
import * as path from 'path';

export const handleInitialCollection = async (c: Context) => {
    const body = await c.req.json();
    const totalAmount = (Number(body.amount)) * 100
    const agreementType = body.agreement
    
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
                    value: totalAmount.toString(), // Agreement Total
                    assetCode: openLoanWalletAddress.assetCode,
                    assetScale: openLoanWalletAddress.assetScale,
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
              debitAmount: {
                value: "100", // Agreement Initiation Payment
                assetCode: customerWalletAddress.assetCode,
                assetScale: customerWalletAddress.assetScale,
              }
            },
          );
    
          const currentDate = new Date().toISOString()
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
                      interval: `R12/${currentDate}/P1M`,
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
            incomingPayment,
            outgoingPaymentGrant,
            quote,
            totalAmount,
            agreementType,
          }
          fs.writeFileSync(path.join(__dirname, '..', '..', 'db.json'), JSON.stringify(db, null, 2), 'utf8');

          return c.json({
            redirect: outgoingPaymentGrant['interact'].redirect
          })
    }
    catch (error) {
        console.log(error)
        return c.text(`Internal Server Error. ${error}`, 500)
    }

};
