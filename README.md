# VOLTIX Server

Production Express/MongoDB API for the VOLTIX electronics marketplace.

## Production start

1. Create `server/.env` from `.env.example` and configure MongoDB, JWT, email, Redis and Stripe values.
2. Install dependencies:

```bash
npm install
```

3. Start the API:

```bash
npm start
```

The application does **not** run database seed scripts at startup and has no seed commands in `package.json`. Product, admin, customer, order and review data are expected to be managed through the application/admin workflows or an already-provisioned production database.

## Environment

See `.env.example` for the required configuration names. Never commit production secrets to source control.

## Database

The server connects to the MongoDB database configured by `MONGO_URI`. There is no runtime dependency on seed data.

## Reviews

Customer reviews are stored in the `Review` collection and are created through the authenticated review API. Product aggregate rating and review counts are maintained by the review workflow.

## Admin

Create or provision the production admin account through your secure deployment process. Do not depend on a seed command in production.

## Supplied 12-product catalogue import

A non-destructive catalogue provisioning utility is included for the 12 products supplied for this project update.

```bash
npm run catalog:import
```

The utility upserts products by SKU, invalidates product Redis caches, and does **not** delete existing products or run automatically when the API starts.

Catalogue distribution:
- Computers & Laptops: 3
- Mobile & Tablets: 3
- Audio & Wearables: 3
- Gaming & Entertainment: 3

Validate the catalogue definition without connecting to MongoDB:

```bash
node qa_catalog12.js
```
