import { serve } from '@hono/node-server';
import * as fs from 'fs';

import app from './app';

const port = 3000;

export let db: Record<string, {
    incomingPayment?: any,
    outgoingPaymentGrant?: any,
    quote?: any
    agreementType?: string
    totalAmount?: number
    manageUrl?: string,
    accessToken?: string,
}> = {}

serve(
    {
        fetch: app.fetch,
        port: port,
    },
    (info) => {
        console.log(`Open Loan 🚀: Port ${info.port}`);
        console.log(__dirname)
        const data = fs.readFileSync(`${__dirname}/db.json`, 'utf8');
        db = JSON.parse(data);
    }
);
