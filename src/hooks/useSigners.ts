import { useState, useEffect } from "react";
import { Signer, XpubTypes } from "@/types/signer";

// Simplified signers hook for Seed-E
const useSigners = () => {
  const [signers, setSigners] = useState<Signer[]>([]);

  useEffect(() => {
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

    setSigners(mockSigners);
  }, []);

  return { signers };
};

export default useSigners;
