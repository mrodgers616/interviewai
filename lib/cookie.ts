"use server"
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const setToken = async (token: string) => {
    console.log("Setting token");
    try {
        // Check if we're in a context where cookies are available
        if (typeof window === 'undefined' && cookies) {
            cookies().set('token', token, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });
            console.log('Cookie set');
            return { success: true, message: 'Token set successfully' };
        } else {
            console.log('Unable to set cookie: not in server context');
            return { success: false, message: 'Unable to set cookie: not in server context' };
        }
    } catch (error) {
        console.error('Error setting token:', error);
        return { success: false, message: 'Error setting token' };
    }
}