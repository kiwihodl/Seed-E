# Seed-E

A neutral, non-custodial directory for third-party Bitcoin signing services, designed to be integrated directly into wallets.

---

## The Problem (Why Seed-E is Needed)

Setting up a robust multisignature wallet often involves a difficult choice for where your keys are located. Finding a trustworthy and technically compatible third-party signing service, in a different geographical location, to mitigate wrenches and 6102 attempts, is a major hurdle. Users are left to navigate a fragmented landscape of trust based on social media presence for individuals, or KYC with companies which these centralized institutions reintroduce a 6102 attack vector, while needing your XPub which means they track and know all of your corresponding balances and transactions. There is no standardized way to engage or verify non-kyc backup key services, until now.

This creates a significant barrier to entry for users wanting to improve their security with a `m-of-n` setup that can (subjectively) include a reliable, professional and reputable third-party.

## The Solution (What Seed-E Is)

Seed-E is an **unopinionated directory**, not a ratings agency. It acts as a plugin for wallets, providing a simple, secure, and neutral platform for users to find and engage with third-party signing service providers. It is the clients responsibility to gauge the trust-worthiness of provider, who is the back up key and signer. Any way of measuring trust and reputation by Seed-E can be gamified or leads to spying, which we refuse to engage in any way.

Our core mission is to facilitate a connection by verifying one thing and one thing only: **that the provider has cryptographic control of the key they offer**. We do not rank, rate, or recommend beyond tenure which is an optional filter. We provide objective data and a secure transaction layer, empowering the user to make their own decision.

### Core Principles

- **Absolutely Non-Custodial:** We never touch clients or providers funds. All payments are peer-to-peer over the Lightning Network using Bolt12.
- **Platform Neutrality:** The default provider list is randomized on every load. We do not play favorites. There is no "top spot" to pay for.
- **User Sovereignty:** The user is in control. They filter the list based on objective, verifiable data (cost, key type, providers tenure) and make their own informed choice.
- **Minimalist Trust:** We verify the provider's key control upfront. After that, the trust relationship is between the client and the provider, where it belongs.
- **Robust Lifecycle Management:** The platform includes automated warnings and clear processes for handling overdue subscription payments, ensuring fairness for both clients and providers.

---

## The User Flow

1.  **Discover:** Inside their wallet's multisig setup if they have the plugin, or in our PWA (progressive web app), the user selects from the keys available.
2.  **Filter & Sort:** The user is shown a **randomized** list of providers. They can filter the list and also apply a sort order:
    - **Filters:** Key Policy Type, Cost (Backup, Signature, or Subscripton - Monthly / Annualy), Provider Since (registration date).
    - **Sort Options:** Default (Random), Fewest Penalties, Longest Time Delay.
3.  **Pay:** The user selects a provider and is presented with a Lightning invoice. They pay the initial backup fee. This grants them access for a set period (e.g., 30 days or forever but with a higher signing fee and / or intial fee).
4.  **Receive:** Upon successful payment, the provider's verified `xpub` is immediately delivered to the clients dashboard for inclusion in their multisig configuration.
5.  **Subscribe (Optional):** If the provider requires a monthly fee, the user can authorize a recurring payment via Nostr Wallet Connect (NIP-47) to maintain access.
6.  **Request Signature:** When a signature is needed, the client authenticates and submits their PSBT without signing it first. The platform records the submission time and calculates the `unlocksAt` date based on the provider's specified delay forementioned in the purchase details.
7.  **Receive Signed PSBT:** After the time delay has passed, the signed PSBT is made available to the client.
8.  **Backup Credentials:** Clients will have access to a secure settings page where, after re-authenticating with 2FA, they can view their credentials and export them to a local file, with strong recommendations to use a password manager.

## The Provider Flow

1.  **Register & Secure Account:** A provider signs up with a username and password and is required to set up Time-based One-Time Password (TOTP) 2FA for account security.
2.  **Define Service:** They create a service listing, providing:
    - The `xpub` of the key they will use.
    - The key's policy type.
    - **Time-Delay Options:** The provider must set a minimum time delay (default 7 days) before a signed PSBT is returned to the client.
    - Fees: Initial backup, per-signature, and an optional monthly subscription fee.
    - A **BOLT12 Offer** (`lno...`) for receiving payments.
3.  **Prove Control:** To be listed, the provider must sign a message with the private key corresponding to the `xpub` they provided. Our backend verifies this signature.
4.  **Handle Requests:** When a user requests a signature, the provider receives a notification. They must upload the signed PSBT before the signing window expires to avoid a penalty.

---

## Time-Delay & Penalty System

To mitigate wrench attacks and provide a transparent measure of provider reliability, Seed-E implements a time-delay and penalty system.

- **Provider-Set Delays:** Providers must set a minimum time-delay (in days) for returning a signed PSBT. This helps protect their clients from being coerced into signing under duress.
- **Signing Window:** Once a signature is requested and the time-delay period begins, the provider has a fixed window (e.g., time-delay + 7 days) to upload the signed PSBT.
- **Penalties:** If a provider fails to upload the signed PSBT within this window, their public `penaltyCount` is incremented.
- **Objective Sorting:** This `penaltyCount` serves as a crucial, non-gameable metric. While Seed-E remains neutral and defaults to a random sort, users can choose to sort providers by "Fewest Penalties," placing the most reliable and responsive providers at the top, while clients can create a new username, this is recorded and the person can still damage the providers reputation socially.

## Subscription & Dunning Lifecycle

To ensure fairness and transparency, Seed-E automates the handling of subscription payments.

1.  **Grace Period:** If a client's monthly payment is missed, a 5-week grace period begins.
2.  **Weekly Warnings:** During the grace period, the client receives a weekly notification warning them of the overdue payment.
3.  **Deletion Warning:** After the second month of non-payment, the warning changes to inform the client that the key is at risk of being deleted by the provider in one month. A countdown is provided with each weekly notification.
4.  **Provider Action (After 3 Months):** After three months of non-payment, the provider has two options on their dashboard:
    - **Delete the Key:** The provider can choose to delete the key. A final, verifiable notification is sent to both the provider and the client confirming this action. The client's outstanding balance is cleared.
    - **Retain the Key:** The provider can choose to hold onto the key. The outstanding balance continues to accrue. The client will be required to pay the full back-charged amount before they can request any future signatures.

---

## Technical Deep Dive

This section is for those interested in the underlying architecture.

The entire payment architecture is designed to be non-custodial, with our service acting as a "proof-of-payment oracle."

- **BOLT12 is Key:** Providers give us a static BOLT12 Offer, not a one-time invoice. This offer contains their node's identity and payment parameters.
- **Non-Custodial Invoice Generation:** When a client wants to pay, our backend does **not** generate an invoice for its own node. Instead, it uses the provider's BOLT12 offer to request a unique, payable invoice _on behalf of the provider_. The destination in the resulting `lnbc...` invoice is the provider's node.
- **Proof of Payment:** The payment flows directly from the client to the provider. Our backend node receives the `invoice_settled` webhook from its node software (e.g., LND, Core Lightning) the instant the payment succeeds. This is our verifiable trigger for all state changes, whether it's releasing an `xpub`, authorizing a signature request, or extending a monthly subscription.
- **Node Infrastructure:** This requires a dedicated, always-on backend Lightning node. A service like **Voltage**, API-controllable node that can handle the programmatic invoice requests and webhook listeners will be required, for testing we are using a newly spun up node. It can also be configured to request recurring payments using standards like Nostr Wallet Connect (NIP-47), this will start with my spare node, to iterate quickly and get it ready for production.

The security model is focused on cryptographic proof and minimizing the platform's role.

- **Upfront Key Verification:** A provider's service is not listed until they sign a challenge string with the private key for the `xpub` they are offering. We verify this `(message, xpub, signature)` tuple to cryptographically prove control. This is the foundation of the platform's integrity.
- **PSBT Handling:** When a client needs a signature, they submit an unsigned PSBT to our backend after paying the providers fee (or if their subscription is active). We pass this to the provider. The provider signs it and submits the signed PSBT back. The platform simply acts as a secure data conduit for the PSBT.
- **Client Authentication:** For signing requests (after the initial backup), clients authenticate using a username, a strong hashed password, and a TOTP-based 2FA code. This provides strong security for initiating sensitive operations like signature requests.

The project is designed as a modern, monolithic web application for simplicity and rapid development.

- **Tech Stack:** A **Next.js** application written in **TypeScript** and styled with **Tailwind CSS**.
- **Progressive Web App (PWA):** The provider-facing part of the app is a PWA. This allows providers to "install" the dashboard on their phone or desktop, giving it an app-like feel and enabling push notifications without the complexity of native app development or app stores.
- **API & Frontend in One:** Next.js API Routes will serve the wallet plugin's requests and the frontend dashboard's data needs. The frontend itself will be built in React.
- **Notifications:** We will use the standard **Web Push API** to send real-time notifications to the provider's PWA when a signature request is pending.
- **Database:** A standard PostgreSQL database to store provider data, service listings, client IDs (with hashed passwords), and payment states.
