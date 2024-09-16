import { NextApiRequest, NextApiResponse } from 'next';

const mockQuestions = [
  "Can you tell me about a challenging project you've worked on?",
  "How do you handle conflicts in a team?",
  "What are your strengths and weaknesses?",
  "Where do you see yourself in 5 years?",
  "Why do you want to work for our company?",
  "How do you stay updated with the latest trends in your field?",
  "Can you describe a situation where you had to meet a tight deadline?",
  "What's your approach to problem-solving?",
  "How do you handle criticism?",
  "What motivates you in your work?"
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { text } = req.body;

    // In a real implementation, you would send the text to an LLM API
    // and get a generated question based on the context.
    // For this mock version, we'll just return a random question.

    const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];

    res.status(200).json({ question: randomQuestion });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}