#!/usr/bin/env node
/**
 * E-School Enterprise API Crypto CLI Tool
 *
 * Usage:
 *   npx ts-node src/scripts/crypto-cli.ts encrypt '{"email":"admin@eschool.com","password":"demo"}'
 *   npx ts-node src/scripts/crypto-cli.ts decrypt "RRq5aZne1nuWNP0+LXQsCsnRO6vgr+NjOagI4BLE/..."
 */

import { ApiCryptoService } from '../shared/crypto/api-crypto.service';

function main() {
  const args = process.argv.slice(2);
  const action = args[0]?.toLowerCase();
  const input = args[1];

  if (!action || !input) {
    console.log(`
======================================================
  E-School Enterprise API Payload Crypto CLI
======================================================

Commands:
  encrypt <jsonString>    Encrypt plain JSON/text into AES-256-GCM Base64
  decrypt <base64Payload> Decrypt AES-256-GCM Base64 into plain JSON

Examples:
  npx ts-node src/scripts/crypto-cli.ts encrypt '{"schoolName":"Greenwood High"}'
  npx ts-node src/scripts/crypto-cli.ts decrypt "RRq5aZne1nuWNP0+..."
`);
    process.exit(1);
  }

  if (action === 'encrypt') {
    try {
      let parsedInput: any = input;
      try {
        parsedInput = JSON.parse(input);
      } catch {
        // use raw string
      }
      const result = ApiCryptoService.encrypt(parsedInput);
      console.log('\n✅ Encrypted Payload (Base64):');
      console.log(result.data);
      console.log('\nJSON Envelope Format:');
      console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error('\n❌ Encryption Error:', err.message);
      process.exit(1);
    }
  } else if (action === 'decrypt') {
    try {
      const decrypted = ApiCryptoService.decrypt(input);
      console.log('\n✅ Decrypted Plain Data:');
      if (typeof decrypted === 'object') {
        console.log(JSON.stringify(decrypted, null, 2));
      } else {
        console.log(decrypted);
      }
    } catch (err: any) {
      console.error('\n❌ Decryption Error:', err.message);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${action}`);
    process.exit(1);
  }
}

main();
