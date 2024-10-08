### Boilerplate for React TypeScript projects using Next.js, shadcn/ui, Tailwind and Firebase on Vercel!

## Runnning
1. npm install
2. node server.mjs
3. npm run dev
4. For running ngrok - ngrok start --config ngrok.yml websocket
5. if using ngrok, update the wsUrl in components/interview-dashboard/interview-dashboard.tsx line 384




This stack is 🔥 because projects can be built and deployed for free until you get to higher tiers within Vercel/Firebase which only happens once you get lots of DAUs.

- **Ve**rcel for cloud and automated deployments
- **Ne**xt.js for better React
- **Fi**rebase for auth and database (Firestore)
- **Sh**adcn and Tailwind for UI/styling


## Setup

1. Make sure your Firebase project has authentication added
1. Get your public Firebase config and paste it into `components\firebase-providers.tsx`
1. `npm i` and `npm run dev`

The following is only needed if you want to use `firebase/admin` (not part of this project by default)

1. Create a new file at the root level called `.env.local`
1. Define a new variable there called `FIREBASE_ADMIN_SDK`
1. Get your Firebase service account private key and stringify it then set the above variable to that string
   > e.g.: `FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"sleeptoken",...}`

### Notes

- You can use `api/test.ts` to stringify your private key so you can use in in the environment
- You need to define the same `FIREBASE_ADMIN_SDK` environment variable in Vercel

