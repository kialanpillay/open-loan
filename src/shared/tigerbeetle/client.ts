import { createClient } from 'tigerbeetle-node'

export function createTigerBeetleClient() {
    const client = createClient({
        cluster_id: 0n,
        replica_addresses: [process.env.TB_ADDRESS || "3001"],
      });
    return client;
}
