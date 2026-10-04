// Prints a bcrypt hash for ADMIN_PASSWORD_HASH. Usage: npm run hash-password -- "your password"
import bcrypt from "bcryptjs";
const pw = process.argv[2];
if (!pw || pw.length < 10) { console.error("Give a password of at least 10 characters."); process.exit(1); }
console.log(bcrypt.hashSync(pw, 12));
