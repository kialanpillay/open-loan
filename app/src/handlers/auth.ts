import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../infrastructure/client'
import { CUSTOMER_WALLET_ADDRESS, OPEN_LOAN_WALLET_ADDRESS } from '../util/constants';
import { db } from '../app';


export const handleInteraction = async (c: Context) => {
    const interactRef = c.req.query('interact_ref') 
    const id = c.req.param('id')
    console.log(`[handleInteraction] for wallet ${id} and interaction reference ${interactRef}`)

    const { grant: outgoingPaymentGrant, quote } = db[id]
    try {
        const client = await createOpenPaymentsClient();
        const continuedGrant: any = await client.grant.continue(
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
                accessToken: continuedGrant['access_token'].value,
            },
            {
                walletAddress: CUSTOMER_WALLET_ADDRESS,
                quoteId: quote.id,
            },
        );
        console.log(continuedGrant)
        console.log(outgoingPayment)
        db[id] = {
            ...db[id],
            accessToken: continuedGrant['access_token'].value,
            manageUrl: continuedGrant['access_token'].manage,
        }
        return c.json(outgoingPayment, 200)
    }
    catch (error) {
        console.log(error)
        return c.text(`Internal Server Error. ${error}`, 500)
    }
};
