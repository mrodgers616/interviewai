import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use a valid, current API version
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId } = req.body;

      // Create Checkout Sessions from body params.
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product: 'prod_QuU2ozzF8mKL59', // Added product ID
              recurring:{'interval':'month','interval_count':1},
              unit_amount: 2000, // $20.00
            },
            quantity: 1,
          },
        ],
        subscription_data: {
            trial_period_days: 3,
        },
        mode: 'subscription',
        success_url: `${req.headers.origin}/api/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment`,
        client_reference_id: userId,
      });

      res.status(200).json({ id: session.id }); // Include sessionId in the response
    } catch (err: any) {
      console.log(err);
      res.status(500).json({ statusCode: 500, message: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
