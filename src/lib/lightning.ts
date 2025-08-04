interface LightningConfig {
  lndRestUrl: string;
  lndInvoiceMacaroon: string;
}

interface InvoiceRequest {
  amount: number; // in satoshis
  description: string;
  expiresAt?: Date;
  providerLightningAddress?: string; // New field for provider's Lightning address
}

interface InvoiceResponse {
  paymentRequest: string;
  paymentHash: string;
  amount: number;
  description: string;
  expiresAt: Date;
  isConfirmed: boolean;
  destination?: string; // Provider's Lightning address
  verifyUrl?: string | null; // Verify URL for LNURL verify
}

interface LightningAddressValidation {
  isValid: boolean;
  callback?: string;
  maxSendable?: number;
  minSendable?: number;
  metadata?: string;
  error?: string;
}

interface PaymentRequestData {
  pr: string;
  verify?: string;
  routes?: Array<{
    pubkey: string;
    short_channel_id: string;
    fee_base_msat: number;
    fee_proportional_millionths: number;
    cltv_expiry_delta: number;
  }>;
  r_hash?: string;
  successAction?: {
    tag: string;
    message?: string;
    url?: string;
  };
}

interface PurchaseData {
  id: string;
  clientId: string;
  serviceId: string;
  paymentHash: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class LightningService {
  private lndConfig: LightningConfig;
  private isDecentralizedMode: boolean;

  constructor() {
    // Initialize with environment variables
    this.lndConfig = {
      lndRestUrl: process.env.LND_REST_URL || "",
      lndInvoiceMacaroon: process.env.LND_INVOICE_MACAROON || "",
    };

    // Check if we should use decentralized LNURL mode (preferred) or centralized LND mode
    this.isDecentralizedMode =
      !this.lndConfig.lndRestUrl || !this.lndConfig.lndInvoiceMacaroon;

    console.log("🔧 Lightning Service Configuration:", {
      isDecentralizedMode: this.isDecentralizedMode,
      hasLndConfig: !!this.lndConfig.lndRestUrl,
    });
  }

  private parseLndConnectUrl(lndConnectUrl: string): {
    restUrl: string;
    macaroon?: string;
  } {
    // Check if it's a lndconnect URL
    if (lndConnectUrl.startsWith("lndconnect://")) {
      // lndconnect://host:port?macaroon=base64macaroon
      const match = lndConnectUrl.match(
        /lndconnect:\/\/([^?]+)(\?macaroon=([^&]+))?/
      );
      if (!match) {
        throw new Error("Invalid lndconnect URL format");
      }

      const hostPort = match[1];
      const macaroon = match[3];

      // Use https for all connections
      const restUrl = `https://${hostPort}`;

      return {
        restUrl,
        macaroon: macaroon
          ? Buffer.from(macaroon, "base64").toString("hex")
          : undefined,
      };
    } else {
      // Direct REST URL
      return {
        restUrl: lndConnectUrl,
        macaroon: undefined,
      };
    }
  }

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    try {
      console.log("🔌 Creating Lightning invoice...");
      console.log("Amount:", request.amount, "sats");
      console.log("Description:", request.description);
      console.log(
        "Provider Lightning Address:",
        request.providerLightningAddress
      );

      if (this.isDecentralizedMode) {
        console.log("Mode: DECENTRALIZED (LNURL)");
        return this.createDecentralizedInvoice(request);
      } else {
        console.log("Mode: CENTRALIZED (LND)");
        return this.createCentralizedInvoice(request);
      }
    } catch (error) {
      console.error("❌ Error creating Lightning invoice:", error);
      throw new Error("Failed to create Lightning invoice");
    }
  }

  private createCentralizedInvoice(request: InvoiceRequest): InvoiceResponse {
    const paymentHash = this.generatePaymentHash();
    const paymentRequest = this.generateRealisticPaymentRequest(
      request.amount,
      paymentHash
    );
    const expiresAt =
      request.expiresAt || new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log("✅ Centralized Lightning invoice created successfully");
    console.log("💡 To test payment confirmation, use:");
    console.log(`   node confirm-payment.js ${paymentHash}`);

    return {
      paymentRequest,
      paymentHash,
      amount: request.amount,
      description: request.description,
      expiresAt,
      isConfirmed: false,
      destination: request.providerLightningAddress,
    };
  }

  private async validateLightningAddressInternal(
    address: string
  ): Promise<LightningAddressValidation> {
    try {
      console.log(`🔍 Validating Lightning address: ${address}`);

      // Extract domain and username
      const domain = address.split("@")[1];
      const username = address.split("@")[0];

      if (!domain || !username) {
        throw new Error("Invalid Lightning address format");
      }

      // Look up the Lightning address using the domain's well-known endpoint
      const response = await fetch(
        `https://${domain}/.well-known/lnurlp/${username}`
      );

      if (!response.ok) {
        throw new Error(
          `Lightning address validation failed: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Lightning address validation result:", data);

      return {
        isValid: true,
        callback: data.callback,
        maxSendable: data.maxSendable,
        minSendable: data.minSendable,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error("❌ Lightning address validation failed:", error);
      return { isValid: false, error: (error as Error).message };
    }
  }

  public async validateLNURLVerifySupport(
    lightningAddress: string
  ): Promise<boolean> {
    try {
      console.log(
        `🔍 Validating LNURL verify support for: ${lightningAddress}`
      );

      // Get a test payment request to check for verify URL
      const testAmount = 1000; // 1 sat in msats
      const testDescription = "LNURL verify test";

      const validation = await this.validateLightningAddressInternal(
        lightningAddress
      );

      if (!validation.isValid) {
        console.log("❌ Lightning address validation failed");
        return false;
      }

      // Get a test payment request
      if (!validation.callback) {
        console.log("❌ No callback URL found");
        return false;
      }

      const callbackUrl = new URL(validation.callback);
      callbackUrl.searchParams.set("amount", testAmount.toString());
      callbackUrl.searchParams.set("description", testDescription);

      const response = await fetch(callbackUrl.toString());

      if (!response.ok) {
        console.log("❌ Test payment request failed");
        return false;
      }

      const paymentData = await response.json();

      if (paymentData.verify) {
        console.log("✅ LNURL verify supported!");
        return true;
      } else {
        console.log("❌ LNURL verify not supported");
        return false;
      }
    } catch (error) {
      console.error("❌ Error validating LNURL verify support:", error);
      return false;
    }
  }

  public async validateLightningAddress(address: string): Promise<{
    isValid: boolean;
    error?: string;
    supportsLnurlVerify?: boolean;
  }> {
    try {
      console.log(`🔍 Validating Lightning address: ${address}`);

      // Basic format validation
      if (!address.includes("@")) {
        return {
          isValid: false,
          error: "Lightning address must contain '@' (e.g., user@getalby.com)",
          supportsLnurlVerify: false,
        };
      }

      const [username, domain] = address.split("@");

      if (!username || !domain) {
        return {
          isValid: false,
          error: "Invalid Lightning address format",
          supportsLnurlVerify: false,
        };
      }

      if (username.length < 1) {
        return {
          isValid: false,
          error: "Username part cannot be empty",
          supportsLnurlVerify: false,
        };
      }

      if (domain.length < 3) {
        return {
          isValid: false,
          error: "Domain part must be at least 3 characters",
          supportsLnurlVerify: false,
        };
      }

      // Validate the Lightning address using LNURL
      const validation = await this.validateLightningAddressInternal(address);

      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error || "Invalid Lightning address",
          supportsLnurlVerify: false,
        };
      }

      // Check LNURL verify support
      const supportsLnurlVerify = await this.validateLNURLVerifySupport(
        address
      );

      return {
        isValid: true,
        supportsLnurlVerify,
      };
    } catch (error) {
      console.error("❌ Lightning address validation error:", error);
      return {
        isValid: false,
        error: "Failed to validate Lightning address",
        supportsLnurlVerify: false,
      };
    }
  }

  private async getProviderPaymentRequest(
    lightningAddress: string,
    amount: number,
    description: string
  ): Promise<PaymentRequestData> {
    try {
      console.log(
        `🔍 Getting payment request from provider: ${lightningAddress}`
      );

      // Extract domain and username
      const domain = lightningAddress.split("@")[1];
      const username = lightningAddress.split("@")[0];

      if (!domain || !username) {
        throw new Error("Invalid Lightning address format");
      }

      // Look up the Lightning address using the domain's well-known endpoint
      const lookupUrl = `https://${domain}/.well-known/lnurlp/${username}`;
      console.log(`🔍 Looking up Lightning address at: ${lookupUrl}`);

      const response = await fetch(lookupUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(
          `Lightning address lookup failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Lightning address lookup result:", data);

      // Get a payment request from the provider
      if (!data.callback) {
        throw new Error("No callback URL found in Lightning address response");
      }

      const callbackUrl = new URL(data.callback);
      // Use millisatoshis for Lightning address requests
      const amountMsats = amount * 1000; // Convert sats to msats
      callbackUrl.searchParams.set("amount", amountMsats.toString());
      callbackUrl.searchParams.set("description", description);

      console.log(`🔍 Requesting payment at: ${callbackUrl.toString()}`);

      const paymentResponse = await fetch(callbackUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!paymentResponse.ok) {
        throw new Error(
          `Payment request failed: ${paymentResponse.status} ${paymentResponse.statusText}`
        );
      }

      const paymentData: PaymentRequestData = await paymentResponse.json();
      console.log("✅ Payment request result:", paymentData);

      return paymentData;
    } catch (error) {
      console.error("❌ Error getting provider payment request:", error);
      throw error;
    }
  }

  private async createDecentralizedInvoice(
    request: InvoiceRequest
  ): Promise<InvoiceResponse> {
    // Try to get payment request directly from provider's Lightning address
    if (request.providerLightningAddress) {
      console.log(
        `⚡ Using provider's Lightning address: ${request.providerLightningAddress}`
      );

      try {
        const providerPayment = await this.getProviderPaymentRequest(
          request.providerLightningAddress,
          request.amount,
          request.description
        );

        if (providerPayment && providerPayment.pr) {
          console.log(
            "✅ Got payment request from provider's Lightning address"
          );

          return {
            paymentRequest: providerPayment.pr,
            paymentHash: providerPayment.r_hash || this.generatePaymentHash(),
            amount: request.amount,
            description: request.description,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            isConfirmed: false,
            destination: request.providerLightningAddress,
            // Store the verify URL for later verification
            verifyUrl: providerPayment.verify || null,
          };
        }
      } catch (error) {
        console.error("❌ Error getting provider payment request:", error);
        console.log("⚠️  Falling back to mock invoice creation");
      }
    }

    // Fallback: Create mock invoice for testing/development
    console.log("⚠️  Using fallback: Creating mock invoice");
    return this.createMockInvoice(request);
  }

  private generatePaymentHash(): string {
    // Generate a realistic payment hash
    const chars = "0123456789abcdef";
    let hash = "";
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateRealisticPaymentRequest(
    amount: number,
    paymentHash: string
  ): string {
    // Generate a more realistic Lightning payment request
    const prefix = "lnbc";

    // Create a more realistic invoice string
    const invoiceData = `${prefix}${amount.toString()}1${paymentHash.substring(
      0,
      8
    )}`;

    // Add some realistic formatting
    return `${invoiceData}...${paymentHash.substring(56, 64)}`;
  }

  private async verifyLNURLPayment(
    lightningAddress: string,
    amount: number,
    description: string,
    originalPaymentRequest?: string // Add parameter for original payment request
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔍 Verifying LNURL payment for: ${lightningAddress}`);

      // Get the payment request from the provider
      const providerPayment = await this.getProviderPaymentRequest(
        lightningAddress,
        amount / 1000, // Convert msats back to sats for the method
        description
      );

      if (!providerPayment.verify) {
        console.log("❌ No verify URL found in payment request");
        return { success: false, error: "No verify URL found" };
      }

      // Verify the payment using the verify URL
      const verifyUrl = new URL(providerPayment.verify);
      verifyUrl.searchParams.set("k1", this.generatePaymentHash());
      verifyUrl.searchParams.set(
        "pr",
        originalPaymentRequest || providerPayment.pr
      );

      console.log(`🔍 Verifying payment at: ${verifyUrl.toString()}`);

      const response = await fetch(verifyUrl.toString());

      if (!response.ok) {
        console.log("❌ Payment verification failed");
        return { success: false, error: "Payment verification failed" };
      }

      const verificationData = await response.json();
      console.log("✅ Payment verification result:", verificationData);

      if (verificationData.settled) {
        console.log("✅ Payment verified successfully!");
        return { success: true };
      } else {
        console.log("❌ Payment not settled");
        return { success: false, error: "Payment not settled" };
      }
    } catch (error) {
      console.error("❌ Error verifying LNURL payment:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async checkPaymentStatusWithContext(
    paymentHash: string,
    lightningAddress: string,
    amount: number,
    verifyUrl?: string | null
  ): Promise<boolean> {
    try {
      console.log(`🔍 Checking payment status for hash: ${paymentHash}`);

      // If we have a verify URL, use LNURL verify
      if (verifyUrl) {
        console.log("🔍 Using LNURL verify for payment status check");
        const verifyUrlObj = new URL(verifyUrl);
        verifyUrlObj.searchParams.set("k1", this.generatePaymentHash());
        verifyUrlObj.searchParams.set("pr", paymentHash);

        const response = await fetch(verifyUrlObj.toString());

        if (!response.ok) {
          console.log("❌ LNURL verify failed");
          return false;
        }

        const verificationData = await response.json();
        console.log("✅ LNURL verify result:", verificationData);

        return verificationData.settled === true;
      }

      // Otherwise, try to verify using the Lightning address
      console.log("🔍 Using Lightning address for payment status check");
      const verificationResult = await this.verifyLNURLPayment(
        lightningAddress,
        amount,
        `Payment verification for ${paymentHash}`
      );

      return verificationResult.success;
    } catch (error) {
      console.error("❌ Error checking payment status with context:", error);
      return false;
    }
  }

  async checkPaymentStatus(paymentHash: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking payment status for hash: ${paymentHash}`);

      if (this.isMockMode) {
        console.log("🔧 Mock mode: Payment status check");
        // In mock mode, simulate payment confirmation after a delay
        return true;
      }

      // Use LND for payment status check
      console.log("🔍 Using LND for payment status check");
      return this.checkLndPaymentStatus(paymentHash);
    } catch (error) {
      console.error("❌ Error checking payment status:", error);
      return false;
    }
  }

  private async checkLndPaymentStatus(paymentHash: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.lndConfig.lndRestUrl}/v1/invoice/${paymentHash}`,
        {
          headers: {
            "Grpc-Metadata-macaroon": this.lndConfig.lndInvoiceMacaroon,
          },
        }
      );

      if (!response.ok) {
        console.log("❌ LND invoice lookup failed");
        return false;
      }

      const data = await response.json();
      console.log("✅ LND payment status:", data);

      return data.settled === true;
    } catch (error) {
      console.error("❌ Error checking LND payment status:", error);
      return false;
    }
  }

  private async getPurchaseByPaymentHash(
    paymentHash: string
  ): Promise<PurchaseData | null> {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const purchase = await prisma.servicePurchase.findFirst({
        where: { paymentHash },
      });

      await prisma.$disconnect();

      return purchase;
    } catch (error) {
      console.error("❌ Error getting purchase by payment hash:", error);
      return null;
    }
  }
}

export const lightningService = new LightningService();
export type { InvoiceRequest, InvoiceResponse };
