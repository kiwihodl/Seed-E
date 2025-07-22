function debugPSBTStructure(psbtBase64, name) {
  console.log(`\n🔍 Debugging ${name} PSBT structure:`);
  
  const psbtBuffer = Buffer.from(psbtBase64, 'base64');
  console.log(`Total length: ${psbtBuffer.length} bytes`);
  
  // Check magic bytes
  const magicBytes = psbtBuffer.subarray(0, 5);
  console.log(`Magic bytes: ${magicBytes.toString('hex')}`);
  
  // Check version
  const version = psbtBuffer.subarray(5, 9);
  console.log(`Version: ${version.toString('hex')}`);
  
  let offset = 9;
  console.log(`\nStarting at offset ${offset}:`);
  
  // Parse global transaction section
  console.log('Global transaction section:');
  while (offset < psbtBuffer.length) {
    const type = psbtBuffer[offset];
    console.log(`  Offset ${offset}: type = 0x${type.toString(16)}`);
    
    if (type === 0x00) {
      console.log(`  Found separator at offset ${offset}`);
      offset++;
      break;
    }
    
    const keyLength = psbtBuffer[offset + 1];
    console.log(`  Key length: ${keyLength}`);
    offset += 2 + keyLength;
    
    const valueLength = psbtBuffer.readUIntLE(offset, 1);
    console.log(`  Value length: ${valueLength}`);
    offset += 1 + valueLength;
  }
  
  // Parse input sections
  console.log('\nInput sections:');
  while (offset < psbtBuffer.length) {
    const type = psbtBuffer[offset];
    console.log(`  Offset ${offset}: type = 0x${type.toString(16)}`);
    
    if (type === 0x00) {
      console.log(`  Found separator at offset ${offset}`);
      offset++;
      break;
    }
    
    const keyLength = psbtBuffer[offset + 1];
    console.log(`  Key length: ${keyLength}`);
    offset += 2;
    
    if (type === 0x02) {
      console.log(`  *** FOUND PARTIAL_SIG RECORD ***`);
    }
    
    const valueLength = psbtBuffer.readUIntLE(offset, 1);
    console.log(`  Value length: ${valueLength}`);
    offset += 1 + valueLength;
  }
  
  // Parse output sections
  console.log('\nOutput sections:');
  while (offset < psbtBuffer.length) {
    const type = psbtBuffer[offset];
    console.log(`  Offset ${offset}: type = 0x${type.toString(16)}`);
    
    if (type === 0x00) {
      console.log(`  Found separator at offset ${offset}`);
      offset++;
      break;
    }
    
    const keyLength = psbtBuffer[offset + 1];
    console.log(`  Key length: ${keyLength}`);
    offset += 2;
    
    const valueLength = psbtBuffer.readUIntLE(offset, 1);
    console.log(`  Value length: ${valueLength}`);
    offset += 1 + valueLength;
  }
}

// Test our PSBTs
const unsignedPSBT = "cHNidP8AAAAAAQAAAAGqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgAAAAD/////AegDAAAAAAAAIgAgu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7sAAAAAAQjoAwAAAAAAACIAILu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7AmtSIczMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMId3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0h7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7uU64AAA==";

const signedPSBT = "cHNidP8AAAAAAQAAAAGqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgAAAAD/////AegDAAAAAAAAIgAgu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7sAAAAAAQjoAwAAAAAAACIAILu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7AiHMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMxH//////////////////////////////////////////////////////////////////////////////////////////////8DAQECa1IhzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMId3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d0h7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7uU64AAA";

debugPSBTStructure(unsignedPSBT, "Unsigned");
debugPSBTStructure(signedPSBT, "Signed"); 