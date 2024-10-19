import {
    createAuthenticatedClient,
    isPendingGrant,
  } from "@interledger/open-payments";
import { OPEN_LOAD_KEY_ID, OPEN_LOAN_WALLET_ADDRESS } from "../util/constants";
import { readFileSync } from "fs";
import path from "path";

export async function createOpenPaymentsClient() {
    console.log(__dirname)
    const key = readFileSync(
        path.join(__dirname, 'key.pem'),
        'utf8'
    );
    
    const client = await createAuthenticatedClient({
        walletAddressUrl: OPEN_LOAN_WALLET_ADDRESS,
        privateKey: key,
        keyId: OPEN_LOAD_KEY_ID,
    });
    return client;
}


