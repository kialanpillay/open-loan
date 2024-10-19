import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../../infrastructure/client'
import { CUSTOMER_WALLET_ADDRESS } from '../../util/constants';
import { db } from '../../server'
import * as fs from 'fs';
import * as path from 'path'


export const handleRecurringCollection = async (c: Context) => {
    const body = await c.req.json();
    const url = body.id as string
    const customerId = url.substring(url.lastIndexOf("/") + 1)

    const { incomingPayment, accessToken, manageUrl, totalAmount, agreementType } = db[customerId]
    
    console.log("Context", totalAmount, manageUrl, agreementType)
    console.log("[collection/recurring] handling request", body)
    try {
        const client = await createOpenPaymentsClient();
        const customerWalletAddress = await client.walletAddress.get({
            url: CUSTOMER_WALLET_ADDRESS,
        });

        const token = await client.token.rotate({
            url: manageUrl as string,
            accessToken: accessToken as string,
        });
  
        db[customerId] = {
            ...db[customerId],
            accessToken: token.access_token.value,
            manageUrl: token.access_token.manage,
        }
        fs.writeFileSync(path.join(__dirname, '..', '..', 'db.json'), JSON.stringify(db, null, 2), 'utf8');

        let debitAmount: number = -1;
        if (agreementType === 'FIXED') {
            debitAmount = (totalAmount as number) / 10
        } else {
            const customerWalletAddress = await client.walletAddress.get({
                url: CUSTOMER_WALLET_ADDRESS,
            });

            const incomingPaymentGrant: any = await client.grant.request(
                {
                  url: customerWalletAddress.authServer,
                },
                {
                  access_token: {
                    access: [
                      {
                        type: "incoming-payment",
                        actions: ["list", "read", "read-all"],
                      },
                    ],
                  },
                },
              );

            console.log({
                walletAddress: CUSTOMER_WALLET_ADDRESS,
                url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
                accessToken: incomingPaymentGrant['access_token'].value,
            })
            const incomingPayments = await client.incomingPayment.list({
                walletAddress: CUSTOMER_WALLET_ADDRESS,
                url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
                accessToken: incomingPaymentGrant['access_token'].value,
            })
            console.log(incomingPayments)
            const transactions = incomingPayments.result.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
            while (debitAmount === -1 && transactions.length > 0) {
                const txn = transactions[0]
                if (txn.receivedAmount &&  Number(txn.receivedAmount.value) > 0) {
                    debitAmount = 0.1 * Number(txn.receivedAmount.value)
                    break;
                }
            }
            // If no transactions, revert to fixed schedule
            if (debitAmount = -1) {
                debitAmount = (totalAmount as number) / 10
            }
        }
    
        const outgoingPayment = await client.outgoingPayment.create(
            {
                url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
                accessToken: token.access_token.value,
            },
            {
                walletAddress: CUSTOMER_WALLET_ADDRESS,
                incomingPayment: incomingPayment.id as string,
                debitAmount: {
                    value: debitAmount.toString(), 
                    assetCode: customerWalletAddress.assetCode,
                    assetScale: customerWalletAddress.assetScale,
                }
            },
        );
        return c.json(outgoingPayment, 200)
    }
    catch (error) {
        console.log(error)
        return c.text(`Internal Server Error. ${error}`, 500)
    }
};
