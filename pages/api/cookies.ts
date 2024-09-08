import { NextApiRequest, NextApiResponse } from "next";
import { setToken } from "@/lib/cookie";
import type { AxiosResponse } from 'axios';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
        
    switch (req.method) {
        case 'GET':
            return res.status(200).json({ name: 'John Doe' })
        case 'POST':
            try {
                const response = await setToken(req.body);
                return res.status(200).json(response);
            } catch (error: any) {
                return res.status(error.status || 400).json({ error: error.message || 'Error setting login token' });
            }
        default:
            return res.status(200).json({ name: 'John Doe' })
    }

}