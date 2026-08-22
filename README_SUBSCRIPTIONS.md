# Varahi Eat & Fit — Subscription & Payment Additions

This project keeps the existing restaurant UI and adds the subscription/order workflows.

## Added
- Gym & Fitness / Yoga & Wellness / Healthy Families priority section
- Silver / Golden / Diamond weekly plans
- MON | TUE | WED | THU | FRI | SAT | SUN meal viewer
- Meal images, protein and calories
- One-step-at-a-time subscription checkout timeline
- Customer-entered delivery time (no forced checkout slot)
- Nutrition customization, instructions and address
- Cashfree one-time checkout integration
- Server-side Cashfree payment confirmation
- Verified Cashfree payment webhooks with idempotency
- Customer account + My Subscription
- Skip meal, 15-day skipped-meal expiry and rescheduling
- Delivery OTP for normal orders
- Admin subscription list, customer search and lifecycle controls
- Admin plan management
- Customer notifications for payment and admin subscription status changes

## Environment
Set these in Vercel for **Production and Preview** as appropriate:
- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_ENV=sandbox` for testing, then `production` for live mode
- `APP_URL=https://your-production-domain`
- `FIREBASE_PROJECT_ID=varahi-eat`
- `FIREBASE_SERVICE_ACCOUNT_JSON=<server-only Firebase service account JSON>`
- `NEXT_PUBLIC_ADMIN_EMAILS=sunkarasivaprasad6@gmail.com` (comma-separated if multiple admins)

Never prefix the Firebase service account variable with `NEXT_PUBLIC_` and never commit the service-account JSON to GitHub.

## Cashfree webhook
Webhook endpoint:
`https://your-production-domain/api/cashfree/webhook`

Configure Cashfree Payment Gateway webhook events for payment success, failed and user-dropped events. Cashfree signs the raw request body; the application verifies `x-webhook-signature` using `CASHFREE_CLIENT_SECRET` before processing it. Duplicate payment webhooks are de-duplicated by Cashfree payment ID.

## Payment confirmation flow
1. Customer completes checkout.
2. The application creates a Cashfree order linked to the pending subscription.
3. Cashfree redirects the customer back to `/subscriptions/checkout/success`.
4. The server verifies the order's payment status with Cashfree.
5. A successful payment changes the subscription to `ACTIVE` and creates a customer notification.
6. The Cashfree webhook independently performs the same server-side confirmation path, so the subscription does not depend only on the browser return page.

## Important
Production Cashfree merchant credentials and the Firebase service-account credentials must be supplied by the business owner. Never commit `.env.local`, service-account JSON, or payment secrets.
