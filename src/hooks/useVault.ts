import { useState, useEffect } from "react";
import { VaultType, VisibilityType } from "@/types/signer";

// Simplified Vault interface for Seed-E
export interface Vault {
  id: string;
  type: VaultType;
  networkType: string;
  archived?: boolean;
  presentationData: {
    visibility: VisibilityType;
  };
  signers: any[];
}

// Simplified vault state management for Seed-E
const useVault = ({
  vaultId = "",
  includeArchived = true,
  getFirst = false,
  getHiddenWallets = true,
}: {
  vaultId?: string;
  includeArchived?: boolean;
  getFirst?: boolean;
  getHiddenWallets?: boolean;
}) => {
  // For Seed-E, we'll use simple state instead of Realm
  const [allVaults, setAllVaults] = useState<Vault[]>([]);
  const [activeVault, setActiveVault] = useState<Vault | null>(null);

  // Mock bitcoin network type for now
  const bitcoinNetworkType = "mainnet";

  useEffect(() => {
    // In Seed-E, we don't create vaults - we just import keys
    // This is a simplified version for key import functionality
    const mockVaults: Vault[] = [];

    if (includeArchived) {
      setAllVaults(mockVaults);
    } else {
      const nonArchivedVaults = mockVaults.filter((vault) => !vault.archived);
      setAllVaults(nonArchivedVaults);
    }

    // Filter by network type
    const networkFilteredVaults = allVaults.filter(
      (vault) => vault.networkType === bitcoinNetworkType
    );

    // Filter out canary vaults
    const nonCanaryVaults = networkFilteredVaults.filter(
      (vault) => vault.type !== VaultType.CANARY
    );

    const allNonHiddenNonArchivedVaults = nonCanaryVaults.filter(
      (vault) => vault.presentationData.visibility === VisibilityType.VISIBLE
    );

    if (!vaultId) {
      if (getHiddenWallets) {
        setAllVaults(nonCanaryVaults);
        setActiveVault(getFirst ? nonCanaryVaults[0] || null : null);
      } else {
        setAllVaults(allNonHiddenNonArchivedVaults);
        setActiveVault(
          getFirst ? allNonHiddenNonArchivedVaults[0] || null : null
        );
      }
    } else {
      const foundVault = networkFilteredVaults.find((v) => v.id === vaultId);
      setActiveVault(foundVault || null);

      if (!getHiddenWallets) {
        setAllVaults(allNonHiddenNonArchivedVaults);
      } else {
        setAllVaults(nonCanaryVaults);
      }
    }
  }, [
    vaultId,
    includeArchived,
    getFirst,
    getHiddenWallets,
    bitcoinNetworkType,
  ]);

  return {
    allVaults,
    activeVault,
    archivedVaults: allVaults.filter((vault) => vault.archived),
  };
};

export default useVault;
