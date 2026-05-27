const dns = require("dns");
const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongoUri);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (error.message.includes("querySrv")) {
      console.warn("SRV DNS resolution failed. Retrying connection using public DNS servers...");
      try {
        dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
        const connection = await mongoose.connect(env.mongoUri);
        console.log(`MongoDB connected (via public DNS): ${connection.connection.host}`);
        return;
      } catch (retryError) {
        console.error("MongoDB connection failed after DNS fallback:", retryError.message);
        process.exit(1);
      }
    }

    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

