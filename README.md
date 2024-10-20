# Open Loan

A micro-financing product built to disrupt the cash economy and optimise collections.

## Links

- Presentation: https://docs.google.com/presentation/d/10mcK7lIkoPe-3MagOSpyXuc6K5djryRbmXMfUY2fPNw/edit?usp=sharing
- Demo: _>(Optional) Link to a live demo.<_

## How it works

Users interact with Open Loan via an intuitive Telegram bot. Through simple chat commands, users can apply for a new loan, authenticate their Open Payments wallet for seamless loan repayment, and initiate custom repayments for when they have excess cash.

In an informal cash economy, business owners and entrepreneurs are 'thin' credit clients with often erratic cash flow behaviors. Open Loan optimises for collection rates by allowing users to opt for a 'Variable' repayment plan, where repayments are a percentage of incoming account deposits, and are also triggered by these deposits, increasing the likelihood of repayment. Users are also offered a traditional 'Fixed' repayment plan with regular payments at a fixed interval.

By using a highly accessible interface like chat together with loan repayment options that work for the target market, Open Loan can confidently finance a challenging market.

## How to run

1. Create a .env file in the base of this repository. Add OPENAI_API_KEY=<your open API key>.
2. Run `npm i` to install the node packages required for this project.
3. In two seperate terminal sessions, run `npm run start-api` and `npm run start-chat-bot` to start the API server and chat bot server respectivly. The API server is a [Hono] REST API used for managing authentication requests with the Open Payments protocol. The chat bot server serves Open Loan to the user via Telegram.
4. Message https://t.me/open_loan_interledger_bot with the /start command.

## Team members

- [Kialin Pillay](https://github.com/kialanpillay)
- [Samuel Sendzul](https://github.com/Samuel-Sendzul)

## Learnings

We learnt about the seamless nature of the Interledger Open Payments protocol. Once implemented correctly, we were able to achieve payments experiences that we've both struggled to achieve with traditional payments applications.

## Achievements

We were able to execute on our original vision with minimal depatures from what we expected to be able to achieve.

## What comes next?

We would like to expand the solution to more chat interfaces for increased market penetration. We'd also like to built an automated loan risk scoring solution to better estimate the risk of incoming loan applications. We can build out the loan application component of the chat bot to include identity verification, user account transaction analysis, and user business discovery to augment the data available to make the loan granting decision.
