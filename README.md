# Open Loan

Open Loan is a micro-financing product designed to disrupt the cash economy and optimize collections. In South Africa, where cash accounts for 50% of money movements in the informal sector, informal traders often struggle to secure financing, while lenders face excessive exposure to delinquent debtors. Open Loan leverages the transparency of Open Payments API standards to increase access to low-cost, instant micro-financing for informal traders and enhance lenders' ability to manage their books by offering smart collection mechanisms and flexible repayment arrangements.

## Links

- Presentation: [Google Slides](https://docs.google.com/presentation/d/10mcK7lIkoPe-3MagOSpyXuc6K5djryRbmXMfUY2fPNw/edit?usp=sharing).
- Demo: [YouTube](https://youtu.be/EH7A6nxjZ_E).

## How Open Loan Works

Users interact with Open Loan via an intuitive Telegram bot. With simple natural language commands, they can apply for new loans, authenticate their Open Payments wallet for seamless recurring payments, manage existing loans, and initiate ad-hoc repayments when they have excess cash.

In an informal, cash-dominated economy, business owners and entrepreneurs are often considered 'thin' credit clients with erratic cash flow behaviors. Open Loan optimizes collection rates by allowing users to choose a 'Variable' repayment plan, where repayments are a percentage of incoming account deposits. Incoming payments are automatically monitored, triggering repayments to increase conversion and facilitate a frictionless repayment experience. Users can also select a traditional 'Fixed' repayment plan, which involves regular payments at a fixed interval.

By combining a highly accessible chat-based interface with loan repayment options tailored to the target market, Open Loan confidently finances a dynamic, emerging market where traditional financial products are insufficiently inclusive.

## Run Instructions

1. Create a .env file in the base of this repository. Add OPENAI_API_KEY=`YOUR_KEY`.
2. Run `npm i` to install the node packages required for this project.
3. In two seperate terminal sessions, run `npm run start-api` and `npm run start-chat-bot` to start the API and Bot services. The Open Loans API is a [Hono] REST API used for managing authentication requests with the Open Payments protocol. Hono is a light-weight web application framework with support for any JavaScript run-time. The Bot service presents the Open Loan application to the user via Telegram.



4. Message https://t.me/open_loan_interledger_bot with the /start command.

## Team members

- [Kialan Pillay](https://github.com/kialanpillay)
- [Samuel Sendzul](https://github.com/Samuel-Sendzul)

## Learnings

We learned about the seamless nature of the Interledger Open Payments protocol. Once implemented correctly, we were able to achieve payment experiences that had previously been difficult to accomplish with traditional payment applications. The declarative nature of the APIs facilitates building core payment operations with ease.

## Achievements

We were able to execute on our original vision with minimal depatures from what we expected to be able to achieve. 

## The Future

We plan to expand the solution to more chat interfaces for increased market penetration and add support for different local languages. We also aim to develop an adaptive credit scoring solution to mitigate risk. Additionally, we will enhance the loan application component of the chatbot to include identity verification, user account transaction analysis, and business discovery, augmenting the data available for approval decisions.
