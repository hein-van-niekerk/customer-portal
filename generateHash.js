// generateHash.js
const argon2 = require('argon2');

async function generateHash() {
  const hash = await argon2.hash("secure123", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });
  console.log("Generated hash:", hash);
}

generateHash();