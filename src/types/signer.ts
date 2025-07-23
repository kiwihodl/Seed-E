export enum SignerType {
  COLDCARD = "COLDCARD",
  TAPSIGNER = "TAPSIGNER",
  JADE = "JADE",
  PASSPORT = "PASSPORT",
  SPECTER = "SPECTER",
  KEYSTONE = "KEYSTONE",
  LEDGER = "LEDGER",
  PORTAL = "PORTAL",
  TREZOR = "TREZOR",
  BITBOX02 = "BITBOX02",
  MY_KEEPER = "MY_KEEPER",
  KEEPER = "KEEPER",
  POLICY_SERVER = "POLICY_SERVER",
  MOBILE_KEY = "MOBILE_KEY",
  SEED_WORDS = "SEED_WORDS",
  UNKOWN_SIGNER = "UNKOWN_SIGNER",
}

export enum SignerCategory {
  HARDWARE = "HARDWARE",
  SOFTWARE = "SOFTWARE",
}

export enum VaultType {
  CANARY = "CANARY",
  DEFAULT = "DEFAULT",
}

export enum VisibilityType {
  HIDDEN = "HIDDEN",
  VISIBLE = "VISIBLE",
}

export enum XpubTypes {
  P2WSH = "P2WSH",
  P2WPKH = "P2WPKH",
}

export interface Signer {
  type: SignerType;
  signerName: string;
  masterFingerprint: string;
  signerXpubs: Record<XpubTypes, any[]>;
  addedOn: Date;
  isBIP85?: boolean;
  isMock?: boolean;
  extraData?: {
    instanceNumber?: number;
  };
  linkedViaSecondary?: boolean;
}

export interface VaultSigner {
  xpub: string;
  xpriv?: string;
  masterFingerprint: string;
  xfp: string;
  derivationPath?: string;
}
