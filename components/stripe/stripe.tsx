import { loadStripe } from '@stripe/stripe-js';
import { FC, useState } from "react";
import { useUser } from "reactfire";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const StripePage: FC = () => {
    const [loading, setLoading] = useState(false);
    const { data: user } = useUser();

    const startStripeCheckout = async () => {
        setLoading(true);
        try {
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
            if (!stripe) throw new Error('Stripe failed to load');

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.uid,
                }),
            });

            const session = await response.json();
            const result = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (result.error) {
                console.error(result.error.message);
            }
        } catch (error) {
            console.error('Error in startStripeCheckout:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-[450px] mx-auto mt-10 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardTitle className="text-2xl font-bold">Join InterviewAI Today!</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">$20/month</h3>
                <p className="mb-4 text-gray-600">Unlock advanced features and unlimited interviews.</p>
                <ul className="list-disc list-inside mb-6 text-gray-700">
                    <li>Unlimited AI-powered mock interviews</li>
                    <li>Personalized feedback and insights</li>
                    <li>Access to premium interview questions</li>
                    <li>Priority customer support</li>
                </ul>
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                    <p className="font-bold">Special Offer:</p>
                    <p>Start with a 3-day free trial. Cancel anytime.</p>
                </div>
                <Button 
                    onClick={startStripeCheckout} 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                    {loading ? 'Processing...' : 'Start Free Trial'}
                </Button>
                <p className="text-xs text-center mt-4 text-gray-500">Secure payment powered by Stripe</p>
            </CardContent>
        </Card>
    );
};