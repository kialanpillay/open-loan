import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../../infrastructure/client'
import { BASE_URL, CUSTOMER_WALLET_ADDRESS, OPEN_LOAN_WALLET_ADDRESS } from '../../util/constants';
import { v4 } from 'uuid';
import { db } from '../../app'

export const handleRecurringCollection = async (c: Context) => {
    const body = await c.req.parseBody();
    const url = body.id as string
    const customerId = url.substring(url.lastIndexOf("/") + 1)
    const agreementType = body.agreementType as 'FIXED' | 'VARIABLE'

    const { quote, accessToken, manageUrl } = db[customerId]
    
    console.log("[collection/recurring] handling request", body)
    try {
        const client = await createOpenPaymentsClient();
        const token = await client.token.rotate({
            url: manageUrl as string,
            accessToken: accessToken as string,
        });
        console.log(token);
        db[customerId] = {
            ...db[customerId],
            accessToken: token.access_token.value,
            manageUrl: token.access_token.manage,
        }
    
        const outgoingPayment = await client.outgoingPayment.create(
            {
                url: new URL(CUSTOMER_WALLET_ADDRESS).origin,
                accessToken: token.access_token.value,
            },
            {
                walletAddress: CUSTOMER_WALLET_ADDRESS,
                quoteId: quote.id,
            },
        );
        console.log(outgoingPayment)
        return c.json(outgoingPayment, 200)
    }
    catch (error) {
        console.log(error)
        return c.text(`Internal Server Error. ${error}`, 500)
    }

};
