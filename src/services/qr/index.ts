import {
  Bytes,
  CryptoAccount,
  CryptoPSBT,
  CryptoOutput,
  URRegistryDecoder,
} from "./bc-ur-registry";

import { Psbt } from "bitcoinjs-lib";
import bs58check from "bs58check";
// import WalletUtilities from "../wallets/operations/utils";

// Simple function to replace WalletUtilities.generateXpubFromMetaData
const generateXpubFromMetaData = (cryptoAccount: any) => {
  const version = Buffer.from("02aa7ed3", "hex");
  const hdKey = cryptoAccount.getOutputDescriptors()[0].getCryptoKey();
  const depth = hdKey.getOrigin().getDepth();
  const depthBuf = Buffer.alloc(1);
  depthBuf.writeUInt8(depth);
  const parentFingerprint = hdKey.getParentFingerprint();
  const components = hdKey.getOrigin().getComponents();
  const lastComponents = components[components.length - 1];
  const index = lastComponents.isHardened()
    ? lastComponents.getIndex() + 0x80000000
    : lastComponents.getIndex();
  const indexBuf = Buffer.alloc(4);
  indexBuf.writeUInt32BE(index);
  const chainCode = hdKey.getChainCode();
  const key = hdKey.getKey();
  const derivationPath = `m/${hdKey.getOrigin().getPath()}`;
  const xPubBuf = Buffer.concat([
    version,
    depthBuf,
    parentFingerprint,
    indexBuf,
    chainCode,
    key,
  ]);
  const xPub = bs58check.encode(xPubBuf);
  const mfp = cryptoAccount.getMasterFingerprint().toString("hex");
  return { xPub, derivationPath, mfp };
};

export const decodeURBytes = (decoder: URRegistryDecoder, bytes: any) => {
  let scanPercentage;
  // Create the decoder object
  decoder.receivePart(bytes);
  scanPercentage = Math.floor(decoder.estimatedPercentComplete() * 100);
  if (decoder.isComplete()) {
    const ur = decoder.resultUR();
    if (ur.type === "crypto-account") {
      const cryptoAccount = CryptoAccount.fromCBOR(ur.cbor);
      const { xPub, derivationPath, mfp } =
        generateXpubFromMetaData(cryptoAccount);
      return {
        data: {
          mfp,
          derivationPath,
          xPub,
        },
        percentage: scanPercentage,
      };
    }
    // Decode the CBOR message to a Buffer
    if (ur.type === "crypto-psbt") {
      const cryptoPsbt = CryptoPSBT.fromCBOR(ur.cbor);
      return {
        data: cryptoPsbt.getPSBT().toString("base64"),
        percentage: scanPercentage,
      };
    }

    if (ur.type === "crypto-output") {
      const cryptOutput = CryptoOutput.fromCBOR(ur.cbor);
      return { data: cryptOutput.toString(), percentage: scanPercentage };
    }

    if (ur.type === "bytes") {
      const result = decoder.resultUR();
      const decoded = result.decodeCBOR();
      const decodedString = decoded.toString();
      if (decodedString.includes("BSMS")) {
        return { data: decodedString, percentage: scanPercentage };
      } else if (
        decodedString.startsWith("psbt") ||
        decodedString.startsWith("PSBT")
      ) {
        const cryptoPsbt = CryptoPSBT.fromCBOR(ur.cbor);
        return {
          data: cryptoPsbt.getPSBT().toString("base64"),
          percentage: scanPercentage,
        };
      } else {
        return { data: decodedString, percentage: scanPercentage };
      }
    }

    const decoded = ur.decodeCBOR();
    // get the original message, assuming it was a JSON object
    const data = JSON.parse(decoded.toString());
    return { data, percentage: scanPercentage };
  }
  return { data: null, percentage: scanPercentage };
};

export const encodePsbtUR = (data: any, rotation: any) => {
  // check for psbt
  try {
    Psbt.fromBase64(data); // will throw if not psbt
    const buff = Buffer.from(data, "base64");
    const cryptoPSBT = new CryptoPSBT(buff);
    const encoder = cryptoPSBT.toUREncoder(rotation);
    return getFragmentedData(encoder);
  } catch (_) {}
};
export const encodeBytesUR = (
  data: any,
  rotation: any,
  type: BufferEncoding = "hex"
) => {
  // check for simple bytes
  try {
    const buff = Buffer.from(data, type);
    const bytes = new Bytes(buff);
    const encoder = bytes.toUREncoder(rotation, undefined, rotation);
    return getFragmentedData(encoder);
  } catch (_) {}
  return [data];
};

export const getFragmentedData = (encoder: any) => {
  const fragments = [];
  for (let c = 1; c <= encoder.fragmentsLength; c++) {
    const ur = encoder.nextPart();
    fragments.push(ur);
  }
  return fragments;
};
