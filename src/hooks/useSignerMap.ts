import { useState, useEffect } from "react";
import { Signer, XpubTypes } from "@/types/signer";
import { getKeyUID } from "@/utils/utilities";

// Simplified signer map for Seed-E key import
const useSignerMap = () => {
  const [signerMap, setSignerMap] = useState<Record<string, Signer>>({});

  useEffect(() => {
    // For Seed-E, we'll use localStorage or simple state instead of Realm
    // This is for key import functionality only

    // Mock signers for demonstration
    const mockSigners: Signer[] = [
      {
        type: "LEDGER" as any,
        signerName: "Ledger Nano S",
        masterFingerprint: "12345678",
        signerXpubs: {
          [XpubTypes.P2WSH]: [],
          [XpubTypes.P2WPKH]: [],
        },
        addedOn: new Date(),
      },
      {
        type: "TREZOR" as any,
        signerName: "Trezor Model T",
        masterFingerprint: "87654321",
        signerXpubs: {
          [XpubTypes.P2WSH]: [],
          [XpubTypes.P2WPKH]: [],
        },
        addedOn: new Date(),
      },
    ];

    // Create signer map
    const newSignerMap: Record<string, Signer> = {};
    mockSigners.forEach((signer) => {
      newSignerMap[getKeyUID(signer)] = signer;
    });

    setSignerMap(newSignerMap);
  }, []);

  return { signerMap };
};

export default useSignerMap;
