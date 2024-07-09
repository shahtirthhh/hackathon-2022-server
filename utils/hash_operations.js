require("dotenv/config");
const Bcrypt = require("bcrypt");

const hash_operations = {
  hash_string: (plaintext) => {
    return Bcrypt.hashSync(
      plaintext,
      parseInt(process.env.BCRYPT_NUMBER_OF_ROUNDS)
    );
  },
  compare_hash: (plaintext, hashed) => {
    return Bcrypt.compareSync(plaintext, hashed);
  },
};
module.exports = hash_operations;
