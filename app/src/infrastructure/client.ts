import {
    createAuthenticatedClient,
    isPendingGrant,
  } from "@interledger/open-payments";
import { OPEN_LOAD_KEY_ID, OPEN_LOAN_WALLET_ADDRESS } from "../util/constants";

export async function createOpenPaymentsClient() {
    const client = await createAuthenticatedClient({
        walletAddressUrl: OPEN_LOAN_WALLET_ADDRESS,
        privateKey: './key.pem',
        keyId: OPEN_LOAD_KEY_ID,
    });
    return client;
}


