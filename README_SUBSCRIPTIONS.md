# Varahi Eat & Fit — Subscription & Payment Additions

This project keeps the existing restaurant UI and adds the approved subscription/order workflows.

## Added
- Gym & Fitness / Yoga & Wellness / Healthy Families priority section
- Silver / Golden / Diamond weekly plans
- MON | TUE | WED | THU | FRI | SAT | SUN meal viewer
- Meal images, protein and calories
- One-step-at-a-time subscription checkout timeline
- Delivery time, nutrition customization, instructions and address
- Cashfree one-time checkout integration
- Customer account + My Subscription
- Skip meal, 15-day skipped-meal expiry and rescheduling
- Normal online checkout via Cashfree or COD
- Delivery OTP for normal orders
- Admin subscription list

## Environment
Copy `.env.example` to `.env.local` and add:
- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_ENV=sandbox` for testing, then `production` for live mode

Cashfree webhook URL:
`/api/cashfree/webhook`

The webhook verifies Cashfree's signature before accepting the event. Payment status is also checked server-side after Cashfree returns to the site.

## Important
The production Cashfree merchant credentials must be supplied by the business owner. Never commit `.env.local` or secret keys.
