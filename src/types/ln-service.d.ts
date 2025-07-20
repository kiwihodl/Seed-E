declare module "ln-service" {
  export interface LndClient {
    // Basic LND client interface
    [key: string]: unknown;
  }

  export interface CreateInvoiceRequest {
    lnd: LndClient;
    tokens: number;
    description?: string;
    expires_at?: string;
  }

  export interface CreateInvoiceResponse {
    id: string;
    request: string;
    tokens: number;
    description?: string;
    created_at: string;
    expires_at: string;
    is_confirmed: boolean;
  }

  export interface GetInvoiceRequest {
    lnd: LndClient;
    id: string;
  }

  export interface GetInvoiceResponse {
    id: string;
    request: string;
    tokens: number;
    description?: string;
    created_at: string;
    expires_at: string;
    is_confirmed: boolean;
    is_outgoing: boolean;
    is_private: boolean;
    is_push: boolean;
    received: number;
    secret: string;
    tokens: number;
  }

  export function createInvoice(
    options: CreateInvoiceRequest
  ): Promise<CreateInvoiceResponse>;
  export function getInvoice(
    options: GetInvoiceRequest
  ): Promise<GetInvoiceResponse>;
}
