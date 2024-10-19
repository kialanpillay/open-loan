import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../infrastructure/client'
import { CUSTOMER_WALLET_ADDRESS, OPEN_LOAN_WALLET_ADDRESS } from '../util/constants';
import { db } from '../app';


export const handleGrantAuth = async (c: Context) => {
    console.log(`[handleGrantAuth]`)
    const interactRef = c.req.query('interact_ref') 
    const walletId = c.req.param('walletId')

    const { grant: outgoingPaymentGrant, quote } = db[walletId]
    try {
        const client = await createOpenPaymentsClient();
        const continuedGrant = await client.grant.continue(
        {
            accessToken: outgoingPaymentGrant.continue.access_token.value,
            url: outgoingPaymentGrant.continue.uri,
        },
        {
            interact_ref: interactRef,
        },
        );
    
        const outgoingPayment = await client.outgoingPayment.create(
        {
            url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
            accessToken: continuedGrant.continue.access_token.value,
        },
        {
            walletAddress: CUSTOMER_WALLET_ADDRESS,
            quoteId: quote.id,
        },
        );
        console.log(outgoingPayment)
        c.text("OK", 200)
    }
    catch (error) {
        console.log(error)
        c.text(`Internal Server Error. ${error}`, 500)
    }
};
