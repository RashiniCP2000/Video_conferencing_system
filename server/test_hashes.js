import bcrypt from "bcryptjs";

const hash1 = "$2b$10$7gl9B3mkRL9AOXX/EmxrX.FYsSt8zd1LNj85uQ0NVKiVwJJyab8Wa"; // rashchathuperera00@gmail.com
const hash2 = "$2b$10$lUYjn74KaG5w26SJMME4Nu8nYB2tZGS3.qrkOlXlj8FiovFdE6q9G"; // sandyperera33@gmail.com

async function check() {
  console.log("Checking password123 against rashchathuperera00:", await bcrypt.compare("password123", hash1));
  console.log("Checking password123 against sandyperera33:", await bcrypt.compare("password123", hash2));
}

check();
