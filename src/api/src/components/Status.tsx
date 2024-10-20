import { html } from 'hono/html';
import type { FC } from 'hono/jsx';

interface SuccessProps {
    status: 'Success' | 'Failed';
}

export const Status: FC<SuccessProps> = ({ status }) => {
    return (
        <div>
            <p class="center" style={'font-size: 36px;'}>
                Open Loan
            </p>
            <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
            <div style={'width: 200px; margin-top: 150px;'}>
                <lottie-player
                    src={status === 'Success' ? "https://lottie.host/2ce46eae-7ba3-48e3-b72a-bd9060739272/1BVqDEk74e.json" : "https://lottie.host/2f941f71-9bb1-403c-a789-fccc74de1045/HC5mRmD7zB.json"}
                    background="transparent"
                    speed="1"
                    style="width: 100%"
                    direction="1"
                    mode="normal"
                    loop
                    autoplay
                ></lottie-player>
            </div>
        </div>
    );
};
