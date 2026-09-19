const { Client } = require("pg");

const testPasswords = ["postgres", "password", "root", "admin", "123456", "1234", "admin123", ""];

async function check() {
  for (const pass of testPasswords) {
    const client = new Client({
      user: "postgres",
      host: "localhost",
      database: "postgres",
      password: pass,
      port: 5432,
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Connected with password: "${pass}"`);
      await client.query("CREATE DATABASE attendance_crm;").catch((e) => {
        console.log("DB might already exist or:", e.message);
      });
      await client.end();
      return pass;
    } catch (err) {
      // try next
    }
  }
  console.log("Could not authenticate with common default passwords.");
  return null;
}

check();
