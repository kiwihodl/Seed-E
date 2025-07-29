const { lightningService } = require("./src/lib/lightning.ts");

async function checkPaymentStatus() {
  const paymentHash = "5SzAj0RsqgsDwHZdbQO7tg47hscrc4oQ2y6mTSInAfg=";

  console.log("🔍 Checking payment status for:", paymentHash);

  try {
    const isPaid = await lightningService.checkPaymentStatus(paymentHash);
    console.log("💰 Payment status:", isPaid ? "PAID" : "NOT PAID");

    if (!isPaid) {
      console.log("❌ Payment not detected. Possible issues:");
      console.log("   - Payment failed or expired");
      console.log("   - Lightning node not connected to network");
      console.log("   - Payment still propagating through network");
      console.log("   - Wrong payment hash format");
    }
  } catch (error) {
    console.error("❌ Error checking payment status:", error);
  }
}

checkPaymentStatus();
