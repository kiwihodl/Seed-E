import React, { createContext, useContext, ReactNode } from "react";

// Simplified translations for Seed-E
const translations = {
  signer: {
    addKeyHardware: "Add Hardware Key",
    connectHardware: "Connect hardware devices",
    addSoftwareKey: "Add Software Key",
    keysInApp: "Keys stored in app",
    hardwareKeysHeader: "Hardware Keys",
    connectHardwareDevices: "Connect hardware devices",
    softwareKeysHeader: "Software Keys",
    keysNoHardwareNeeded: "No hardware needed",
    purchaseWallet: "Purchase Wallet",
    keyHistory: "Key History",
    usageTimeline: "View usage timeline",
    manualRegistration: "Manual Registration",
    registerActiveVault: "Register with active vault",
    serverPolicySettings: "Server Policy Settings",
    updateServerKeyPolicy: "Update server key policy",
    signingReq: "Signing Requests",
    seePendingSigning: "See pending signing requests",
    manageTapsigner: "Manage Tapsigner",
    manageTapsignerCard: "Configure Tapsigner settings",
    additionalInfo: "Additional Info",
    accociateContactAndDesc: "Associate contact and description",
    mobileKeySeedWords: "Mobile Key Seed Words",
    mobileKeySeedOptionSubtitle: "View mobile key seed words",
    changeDeviceType: "Change Device Type",
    deviceList: "Choose from device list",
    deviceType: "Device Type",
    hideKey: "Hide Key",
    hideKeyDesc: "Hide this key from view",
    keyHiddenSuccessfully: "Key hidden successfully",
    coldCardInfo: "Coldcard hardware wallet",
    coldCardDesx: "Air-gapped hardware wallet",
    tapsignerInfo: "Tapsigner hardware wallet",
    tapsignerDes: "NFC-enabled hardware wallet",
    ledgerInfo: "Ledger hardware wallet",
    seedSigerInfo: "SeedSigner hardware wallet",
    seedSigerDes: "DIY hardware wallet",
    keyStoneInfo: "Keystone hardware wallet",
    keystoneDes: "QR-based hardware wallet",
    foundationInfo: "Foundation Passport",
    foundationDesc: "Open source hardware wallet",
    mobileKeyInfo: "Mobile Key",
    mobileKeyDes: "Key stored on mobile device",
    seedKeyInfo: "Seed Key",
    seedKeyDes: "Key from seed words",
    externalKeyinfo: "External key information",
    externalKeyDes: "External key description",
    serverKeyinfo: "Server Key",
    serverKeyDesc: "Remote signing server",
    biTBoxInfo: "Bitbox 02 hardware wallet",
    bitBoxDesx: "Swiss hardware wallet",
    trezorInfo: "Trezor hardware wallet",
    trezorDes: "Czech hardware wallet",
    jadeInfo: "Jade Blockstream",
    jadeDesc: "Blockstream hardware wallet",
    specterInfo: "Specter DIY",
    specterDesc: "DIY hardware wallet",
    kruxInfo: "Krux hardware wallet",
    kruxDesc: "DIY hardware wallet",
    missingSingleSigTitle: "Missing Single Sig Key",
    missingSingleSigSubTitle: "Add a single sig key for {device}",
    backingUp: "Backing up",
    writeBackupSeed: "Write backup seed for",
    doItPrivately: "Do it privately",
    failedCanaryWallet: "Failed to create canary wallet",
  },
  vault: {
    Addsigner: "Add Signer",
    SelectSignerSubtitle: "Select signer type",
    keyHistory: "Key History",
    usageTimeline: "Usage timeline",
    manualRegistration: "Manual Registration",
    registerActiveVault: "Register with active vault",
    serverPolicySettings: "Server Policy Settings",
    updateServerKeyPolicy: "Update server key policy",
    changeDeviceType: "Change Device Type",
    wantTochageDevice: "Do you want to change device type?",
    keyUsedForVault: "Key Used for Vault",
    keysTryingToHide: "This key is used in a vault",
    ViewVault: "View Vault",
    toHideKey: "To hide this key",
    toviewMobileKey: "To view mobile key",
  },
  common: {
    Okay: "Okay",
    needHelp: "Need Help",
    continue: "Continue",
    cancel: "Cancel",
    confirm: "Confirm",
    confirmPassCode: "Confirm Passcode",
    proceed: "Proceed",
    back: "Back",
    addNow: "Add Now",
    backupNow: "Backup Now",
    somethingWrong: "Something went wrong",
  },
  signingServer: {
    attention: "Attention",
    attentionSubTitle: "Backup your server key now",
    BackUpModalTitle: "Backup Server Key",
    BackUpModalSubTitle: "Backup your server key",
    serverKeyBackup: "Server key already backed up",
    saveBackup: "Save backup securely",
    additionalUsers: "Additional Users",
    AddMultipleUsers: "Add multiple users to this server",
    unlockKeeperPrivate: "Unlock with Keeper Private",
  },
  wallet: {
    canaryWallet: "Canary Wallet",
    canaryWalletFor: "Canary wallet for",
    onChainKeyAlert: "On-chain key alert",
    warningContentData: "Warning content data",
    deviceDoesntRequireVaultRegistration:
      "Device does not require vault registration",
  },
  error: {
    invalidOtpshort: "Invalid OTP",
    oneTimeBackupNotSupported: "One-time backup not supported",
  },
  formatString: (template: string, ...args: any[]) => {
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      return args[index] || match;
    });
  },
};

interface LocalizationContextType {
  translations: typeof translations;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined
);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <LocalizationContext.Provider value={{ translations }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
};

export { LocalizationContext };
