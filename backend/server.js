import "dotenv/config";

import app from "./app.js";
import prisma from "./utils/prisma.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Neon PostgreSQL connected successfully.");

    app.listen(PORT, () => {
      console.log(`CThru API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start CThru API:", error);

    process.exit(1);
  }
}

startServer();
