const CRYPTO = require("crypto");
require("dotenv/config");

const ALGORITHM = "aes-256-cbc";

exports.encrypt_aadhar = (aadhar) => {
  for (var field in aadhar) {
    if (field == "id" || field == "email") {
      continue;
    } else {
      aadhar[field] = this.encrypt_string(aadhar[field]);
    }
  }
  return aadhar;
};
exports.decrypt_aadhar = (aadhar) => {
  const my_aadhar = {};
  for (var field in aadhar) {
    if (field == "id" || field == "email") {
      my_aadhar[field] = aadhar[field];
    } else {
      my_aadhar[field] = this.decrypt_string(aadhar[field]);
    }
  }
  return my_aadhar;
};
exports.encrypt_string = (plaintext) => {
  const cipher = CRYPTO.createCipheriv(
    ALGORITHM,
    process.env.CRYPTO_SECRET_KEY,
    process.env.CRYPTO_INIT_VECTOR
  );
  let encData = cipher.update(plaintext, "utf-8", "hex");
  encData += cipher.final("hex");
  return encData;
};

exports.decrypt_string = (cipher) => {
  const decipher = CRYPTO.createDecipheriv(
    ALGORITHM,
    process.env.CRYPTO_SECRET_KEY,
    process.env.CRYPTO_INIT_VECTOR
  );
  let decData = decipher.update(cipher, "hex", "utf-8");
  decData += decipher.final("utf-8");
  return decData;
};
