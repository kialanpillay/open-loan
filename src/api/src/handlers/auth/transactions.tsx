import type { Context } from "hono";
import { createOpenPaymentsClient } from "../../../../shared/interledger/infrastructure/client";
import {
  getLoanByLoanId,
  updateLoanGrants,
} from "../../../../chat-bot/src/services/loans";
import { Layout } from "../../components/Layout";
import { Status } from "../../components/Status";
import { sendLoanOutcomeToUser } from "../../services/notifications";

export const handleTransactionsInteraction = async (c: Context) => {
  const interactRef = c.req.query("interact_ref");
  const id = c.req.param("id");
  console.log(
    `[handleInteraction] for loan ${id} and interaction reference ${interactRef}`
  );

  const loan = await getLoanByLoanId(id);

  const { userIncomingPaymentsGrant } = loan.grants;
  try {
    const client = await createOpenPaymentsClient();
    const continuedGrant: any = await client.grant.continue(
      {
        accessToken: userIncomingPaymentsGrant.continue.access_token.value,
        url: userIncomingPaymentsGrant.continue.uri,
      },
      {
        interact_ref: interactRef,
      }
    );

    updateLoanGrants(id, {
      transactionsAccessToken: continuedGrant["access_token"].value,
      transactionsManageUrl: continuedGrant["access_token"].manage,
    });

    await sendLoanOutcomeToUser(loan.userId, loan.id);

    return c.render(
      <Layout>
        <Status status={"Success"} />
      </Layout>
    );
  } catch (error) {
    console.log(error);
    return c.text(`Internal Server Error. ${error}`, 500);
  }
};
