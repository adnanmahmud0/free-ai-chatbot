require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect(process.env.MongoDB);
    console.log("Connected successfully");
    process.exit(0);
  } catch (e) {
    console.error("Connection error:", e.message);
    process.exit(1);
  }
}

test();
