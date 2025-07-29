#!/usr/bin/env node

const bitcoin = require('bitcoinjs-lib');
const BIP32Factory = require('bip32');
const ecc = require('tiny-secp256k1');
const crypto = require('crypto');

// Initialize libraries
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

/**
 * Generate an ownership signature for XPUB registration
 */
function generateOwnershipSignature(xpub, privateKeyWIF, xpubHash) {
  try {
    // Create the message to sign
    const message = `I own this XPUB for Seed-E service: ${xpubHash}`;
    console.log('📝 Message to sign:', message);

    // Import the private key
    const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF);
    
    // Create message hash
    const messageHash = bitcoin.crypto.sha256(Buffer.from(message, 'utf8'));
    
    // Sign the message
    const signature = ecc.sign(messageHash, keyPair.privateKey);
    
    // Convert to base64
    const signatureBase64 = signature.toString('base64');
    
    console.log('🔐 Generated signature:', signatureBase64);
    console.log('✅ Signature length:', signatureBase64.length, 'characters');
    
    return {
      message,
      signature: signatureBase64,
      xpubHash
    };
  } catch (error) {
    console.error('❌ Error generating signature:', error.message);
    return null;
  }
}

/**
 * Verify the signature
 */
function verifyOwnershipSignature(signature, message, xpub) {
  try {
    // Import the XPUB to get the public key
    const node = bip32.fromBase58(xpub);
    const publicKey = node.publicKey;

    // Create message hash
    const messageHash = bitcoin.crypto.sha256(Buffer.from(message, 'utf8'));

    // Parse the signature
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // Verify the signature
    const isValid = ecc.verify(messageHash, signatureBuffer, publicKey);
    
    console.log('🔍 Signature verification:', isValid ? '✅ VALID' : '❌ INVALID');
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error.message);
    return false;
  }
}

// Example usage
if (require.main === module) {
  const xpub = process.argv[2];
  const privateKeyWIF = process.argv[3];
  
  if (!xpub || !privateKeyWIF) {
    console.log('Usage: node generate-ownership-signature.js <xpub> <private_key_wif>');
    console.log('');
    console.log('Example:');
    console.log('node generate-ownership-signature.js "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gY29AREAckqC3mNdMMM6VnVVecdWu6oAC9QduXmihMHVGRUdbvM7" "L4rK1yDtCWekvXuE6oXD9jE77qL7rTLc9yIxw4ExUPH6h4ayKJv");
    process.exit(1);
  }

  console.log('🔐 XPUB Ownership Signature Generator');
  console.log('=====================================');
  console.log('XPUB:', xpub);
  console.log('');

  // Generate hash
  const xpubHash = crypto.createHash('sha256').update(xpub.trim()).digest('hex');
  console.log('📋 XPUB Hash:', xpubHash);
  console.log('');

  // Generate signature
  const result = generateOwnershipSignature(xpub, privateKeyWIF, xpubHash);
  
  if (result) {
    console.log('');
    console.log('🎯 API Request Data:');
    console.log('ownershipMessage:', JSON.stringify(result.message));
    console.log('ownershipSignature:', JSON.stringify(result.signature));
    console.log('');
    
    // Verify the signature
    console.log('🔍 Verifying signature...');
    verifyOwnershipSignature(result.signature, result.message, xpub);
  }
}

module.exports = {
  generateOwnershipSignature,
  verifyOwnershipSignature
}; 