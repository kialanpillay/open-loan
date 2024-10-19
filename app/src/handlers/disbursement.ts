import type { Context } from 'hono';
import { createOpenPaymentsClient } from '../infrastructure/client'

export const handleDisbursement = async (c: Context) => {
    return c.text('OK', 200)
};
