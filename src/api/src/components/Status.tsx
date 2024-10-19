import { html } from 'hono/html';
import type { FC } from 'hono/jsx';

interface SuccessProps {
    status: 'Success' | 'Failed';
}

export const Status: FC<SuccessProps> = ({ status }) => {
    return (
        <div>
            <p class="center" style={'font-size: 36px;'}>
                Open Loan - {status}
            </p>
        </div>
    );
};
