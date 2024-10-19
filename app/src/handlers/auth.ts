import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../infrastructure/client'
import { CUSTOMER_WALLET_ADDRESS } from '../util/constants';
import { db } from '../server';
import * as fs from 'fs';
import * as path from 'path';

export const handleInteraction = async (c: Context) => {
    const interactRef = c.req.query('interact_ref') 
    const id = c.req.param('id')
    console.log(`[handleInteraction] for wallet ${id} and interaction reference ${interactRef}`)

    const { outgoingPaymentGrant, quote } = db[id]
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
        db[id] = {
            ...db[id],
            accessToken: continuedGrant['access_token'].value,
            manageUrl: continuedGrant['access_token'].manage,
        }
        fs.writeFileSync(path.join(__dirname, '..', 'db.json'), JSON.stringify(db, null, 2), 'utf8');

        return c.json(outgoingPayment, 200)
    }
    catch (error) {
        console.log(error)
        return c.text(`Internal Server Error. ${error}`, 500)
    }
};
