import type { Context } from "hono";
import { AccountFlags, id } from 'tigerbeetle-node'
import { createTigerBeetleClient } from "../../../../shared/tigerbeetle/client";

export const handleAccountCreation = async (c: Context) => {
  try {
    
      const client = createTigerBeetleClient();
      const accounts = await client.lookupAccounts([1n]);
      if (accounts.length === 0) {
        const account = {
          id: 1n, 
          debits_pending: 0n,
          debits_posted: 0n,
          credits_pending: 0n,
          credits_posted: 0n,
          user_data_128: 0n,
          user_data_64: 0n,
          user_data_32: 0,
          reserved: 0,
          ledger: 1,
          code: 718,
          flags: AccountFlags.history,
          timestamp: 0n,
        };
        await client.createAccounts([account]);
        const accounts = await client.lookupAccounts([1n]);
        return c.json({accountId: accounts[0].id.toString()}, 201);
      }

    return c.json({accountId: accounts[0].id.toString()}, 201);
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
