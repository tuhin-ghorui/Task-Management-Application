const http = require("http");

const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");

const server = http.createServer(app);

const startServer = async () => {
  await connectDB();

  server.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error.message);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

startServer();
