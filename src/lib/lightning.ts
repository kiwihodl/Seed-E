interface LightningConfig {
  lndRestUrl: string;
  lndInvoiceMacaroon: string;
}

interface InvoiceRequest {
  amount: number; // in satoshis
  description: string;
  expiresAt?: Date;
}

interface InvoiceResponse {
  paymentRequest: string;
  paymentHash: string;
  amount: number;
  description: string;
  expiresAt: Date;
  isConfirmed: boolean;
}

class LightningService {
  private config: LightningConfig;

  constructor() {
    const lndConnectUrl = process.env.LND_REST_URL!;
    const macaroon = process.env.LND_INVOICE_MACAROON!;

    if (!lndConnectUrl || !macaroon) {
      throw new Error(
        "LND configuration missing. Please set LND_REST_URL and LND_INVOICE_MACAROON"
      );
    }

    // Parse lndconnect URL
    const parsed = this.parseLndConnectUrl(lndConnectUrl);
    this.config = {
      lndRestUrl: parsed.restUrl,
      lndInvoiceMacaroon: parsed.macaroon || macaroon,
    };
  }

  private parseLndConnectUrl(lndConnectUrl: string): {
    restUrl: string;
    macaroon?: string;
  } {
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
  }

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    try {
      console.log("🔌 Creating Lightning invoice...");
      console.log("Amount:", request.amount, "sats");
      console.log("Description:", request.description);

      // Generate a realistic Lightning invoice for testing
      const paymentHash = this.generatePaymentHash();
      const paymentRequest = this.generatePaymentRequest(
        request.amount,
        paymentHash
      );
      const expiresAt =
        request.expiresAt || new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      console.log("✅ Lightning invoice created successfully");

      return {
        paymentRequest,
        paymentHash,
        amount: request.amount,
        description: request.description,
        expiresAt,
        isConfirmed: false,
      };
    } catch (error) {
      console.error("❌ Error creating Lightning invoice:", error);
      throw new Error("Failed to create Lightning invoice");
    }
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

  private generatePaymentRequest(amount: number, paymentHash: string): string {
    // Generate a realistic Lightning payment request
    const timestamp = Math.floor(Date.now() / 1000);
    const network = "bc"; // Bitcoin mainnet
    const prefix = "lnbc";

    // Create a realistic invoice string
    const invoiceData = `${prefix}${amount.toString()}1${paymentHash.substring(
      0,
      8
    )}`;
    return invoiceData;
  }

  async checkPaymentStatus(paymentHash: string): Promise<boolean> {
    // For testing, always return false (not paid)
    // In production, this would check the real LND node
    return false;
  }

  async createBolt12Offer(request: InvoiceRequest): Promise<string> {
    // For now, we'll create a regular invoice
    // Bolt12 offers require more complex setup
    const invoice = await this.createInvoice(request);
    return invoice.paymentRequest;
  }
}

export const lightningService = new LightningService();
export type { InvoiceRequest, InvoiceResponse };
