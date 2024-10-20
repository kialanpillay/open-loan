import type { FC } from 'hono/jsx';

interface LayoutProps {
    children: unknown;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
    return (
        <html>
            <head>
                <title>Open Loan</title>
                <style>{`
                    body {
                        font-family: helvetica, sans-serif;
                        display: flex;
                        flex-direction: column;
                        min-height: 100vh;
                        margin: 0;
                    }
                    header, main {
                        width: 100%;
                    }
                    .center {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        margin-top: -50px;
                        width: 100%;
                    }
                    main {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        @supports (justify-content: safe center) {
                            justify-content: safe center;
                        }
                        align-items: center;
                        position: absolute;
                        top:0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        margin: auto;
                    }
                    p {
                        font-style: normal;
                        font-weight: 500;
                        line-height: 150%;
                        letter-spacing: -0.16px;
                        text-align: center;
                    }
                `}</style>
            </head>
            <body>
                <main>
                    <div>{children}</div>
                </main>
            </body>
        </html>
    );
};
