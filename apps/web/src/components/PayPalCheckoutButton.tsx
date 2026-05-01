import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

type PayPalCheckoutButtonProps = {
  amountUsd: string;
  disabled?: boolean;
};

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

const PayPalCheckoutButton: React.FC<PayPalCheckoutButtonProps> = ({ amountUsd, disabled = false }) => {
  if (!paypalClientId) {
    return (
      <p className="text-xs text-gray-500">
        PayPal checkout is disabled. Set <code>VITE_PAYPAL_CLIENT_ID</code> to enable it.
      </p>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', intent: 'capture' }}>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' }}
        disabled={disabled}
        createOrder={async (_, actions) => actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: amountUsd,
              },
            },
          ],
        })}
        onApprove={async (_, actions) => {
          await actions.order?.capture();
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalCheckoutButton;
