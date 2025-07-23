export enum APP_STAGE {
  DEVELOPMENT = "DEVELOPMENT",
  PRODUCTION = "PRODUCTION",
}

// Seed-E specific constants
export const SEED_E_KNOWLEDGEBASE = "https://help.seed-e.app/hc/en-us/";
export const SEED_E_WEBSITE_BASE_URL = "https://seed-e.app";

export const PENDING_HEALTH_CHECK_TIME_DEV = 3 * 60 * 60 * 1000; // 3 hours
export const PENDING_HEALTH_CHECK_TIME_PROD = 90 * 24 * 60 * 60 * 1000; // 90 days

// Default configuration for Seed-E
const DEFAULT_CONFIG = {
  RELAY: "https://seed-e-dev-relay.el.r.appspot.com/",
  SIGNING_SERVER_TESTNET: "https://dev-sign.seed-e.com/",
  SIGNING_SERVER_MAINNET: "https://sign.seed-e.com/",
  ENC_KEY_STORAGE_IDENTIFIER: "SEED-E-KEY",
  SEED_E_ID_TESTNET: "seed-e-testnet-id-123456789",
  SEED_E_ID_MAINNET: "seed-e-mainnet-id-987654321",
  SENTRY_DNS: "https://seed-e-sentry-dns.example.com",
  ENVIRONMENT: APP_STAGE.DEVELOPMENT,
  CHANNEL_URL: "https://seed-e-channel-dev.herokuapp.com/",
  RAMP_BASE_URL: "https://app.ramp.network/",
  RAMP_REFERRAL_CODE: "seed-e-ramp-code",
};

class Configuration {
  public RELAY = DEFAULT_CONFIG.RELAY;

  // RAMP details
  public RAMP_BASE_URL: string = DEFAULT_CONFIG.RAMP_BASE_URL;
  public RAMP_REFERRAL_CODE: string = DEFAULT_CONFIG.RAMP_REFERRAL_CODE;

  public SIGNING_SERVER_TESTNET = DEFAULT_CONFIG.SIGNING_SERVER_TESTNET;
  public SIGNING_SERVER_MAINNET = DEFAULT_CONFIG.SIGNING_SERVER_MAINNET;

  public SEED_E_ID_TESTNET: string = DEFAULT_CONFIG.SEED_E_ID_TESTNET;
  public SEED_E_ID_MAINNET: string = DEFAULT_CONFIG.SEED_E_ID_MAINNET;
  public SEED_E_ID: string;

  public BIP85_IMAGE_ENCRYPTIONKEY_DERIVATION_PATH =
    "m/83696968'/39'/0'/12'/83696968'";

  public VAC_CHILD_INDEX: number = 3012009;

  public ENC_KEY_STORAGE_IDENTIFIER: string =
    DEFAULT_CONFIG.ENC_KEY_STORAGE_IDENTIFIER;

  public SENTRY_DNS: string = DEFAULT_CONFIG.SENTRY_DNS;

  public REQUEST_TIMEOUT: number = 15000;

  public GAP_LIMIT: number = 20;

  public ENVIRONMENT: string;

  public CHANNEL_URL: string = DEFAULT_CONFIG.CHANNEL_URL;

  public ZENDESK_USERNAME: string = "";
  public ZENDESK_PASSWORD: string = "";
  public ZENDESK_BASE_URL: string = "";
  public ZENDESK_CHANNEL_ID: string = "";

  public GASFREE_API_KEY: string = "";
  public GASFREE_API_SECRET: string = "";

  public RENEWAL_WINDOW: number;

  constructor() {
    this.ENVIRONMENT = DEFAULT_CONFIG.ENVIRONMENT;

    this.RENEWAL_WINDOW =
      this.ENVIRONMENT === APP_STAGE.PRODUCTION
        ? 30.44 * 3 * 24 * 60 * 60 * 1000 // 3 months
        : 3 * 60 * 60 * 1000; // 3 hours

    this.SEED_E_ID =
      this.ENVIRONMENT === APP_STAGE.PRODUCTION
        ? this.SEED_E_ID_MAINNET
        : this.SEED_E_ID_TESTNET;
  }

  public isDevMode = () => {
    return this.ENVIRONMENT === APP_STAGE.DEVELOPMENT;
  };
}

export default new Configuration();
