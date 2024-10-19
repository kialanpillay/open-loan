import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jsxRenderer } from 'hono/jsx-renderer';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { handleDisbursement } from './handlers/disbursement';
import { handleInitialCollection } from './handlers/collection/initial';
import { handleInteraction } from './handlers/auth';
import { handleRecurringCollection } from './handlers/collection/recurring';

const app = new Hono();

export const db: Record<string, {
    grant?: any,
    quote?: any
    agreementType?: 'FIXED' | 'VARIABLE'
    totalAmount?: number
    manageUrl?: string,
    accessToken?: string,
}> = {}

// CORS middleware
app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true,
    })
);

// Other middleware
app.use('*', logger());
app.use(
    '*',
    secureHeaders({
        xFrameOptions: false,
    })
);
app.use('*', jsxRenderer());

app.get('/', (c) => c.text("Open Loan"));

app.post('/collect/initial', handleInitialCollection);

app.post('/collect/recurring', handleRecurringCollection);

app.post('/disbursement', handleDisbursement);

app.get('/auth/:id', handleInteraction);

export default app;
