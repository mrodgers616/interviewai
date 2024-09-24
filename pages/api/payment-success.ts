import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_APPID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENTID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { session_id } = req.query;

      if (typeof session_id !== 'string') {
        throw new Error('Invalid session_id');
      }

      const session = await stripe.checkout.sessions.retrieve(session_id);
      const userId = session.client_reference_id;

      if (!userId) {
        throw new Error('No user ID found in session');
      }

      // Update user's 'paid' status in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { paid: true });

      // Redirect to the app page
      res.writeHead(302, { Location: '/app' });
      res.end();
    } catch (error) {
      console.error('Error processing payment success:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
}