import { SignerType } from "@/types/signer";

// Simplified hardware utilities for Seed-E key import
export const getSignerNameFromType = (
  type: SignerType,
  isMock: boolean = false,
  showAsterisk: boolean = true
): string => {
  const asterisk = showAsterisk ? "*" : "";

  switch (type) {
    case SignerType.COLDCARD:
      return `Coldcard${asterisk}`;
    case SignerType.TAPSIGNER:
      return `Tapsigner${asterisk}`;
    case SignerType.JADE:
      return `Jade${asterisk}`;
    case SignerType.PASSPORT:
      return `Passport${asterisk}`;
    case SignerType.SPECTER:
      return `Specter${asterisk}`;
    case SignerType.KEYSTONE:
      return `Keystone${asterisk}`;
    case SignerType.LEDGER:
      return `Ledger${asterisk}`;
    case SignerType.PORTAL:
      return `Portal${asterisk}`;
    case SignerType.TREZOR:
      return `Trezor${asterisk}`;
    case SignerType.BITBOX02:
      return `Bitbox02${asterisk}`;
    case SignerType.MY_KEEPER:
      return `Seed-E Key${asterisk}`;
    case SignerType.KEEPER:
      return `External Seed-E${asterisk}`;
    case SignerType.POLICY_SERVER:
      return `Policy Server${asterisk}`;
    case SignerType.MOBILE_KEY:
      return `Mobile Key${asterisk}`;
    case SignerType.SEED_WORDS:
      return `Seed Words${asterisk}`;
    case SignerType.UNKOWN_SIGNER:
      return `Unknown Device${asterisk}`;
    default:
      return `Unknown${asterisk}`;
  }
};
