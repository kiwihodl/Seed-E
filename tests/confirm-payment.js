async function confirmPayment(paymentHash) {
  try {
    console.log(`💰 Confirming payment for hash: ${paymentHash}`);

    const response = await fetch(
      "http://localhost:3000/api/services/confirm-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentHash: paymentHash,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Payment confirmed successfully!");
      console.log("📋 Result:", result);
    } else {
      const error = await response.json();
      console.error("❌ Payment confirmation failed:", error);
    }
  } catch (error) {
    console.error("❌ Error confirming payment:", error);
  }
}

// Get payment hash from command line argument
const paymentHash = process.argv[2];

if (!paymentHash) {
  console.error("❌ Please provide a payment hash as an argument");
  console.log("Usage: node confirm-payment.js <payment-hash>");
  process.exit(1);
}

confirmPayment(paymentHash);
