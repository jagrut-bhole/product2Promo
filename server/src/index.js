import connectDB from "./db/index.js";

import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    app.on("error", (error) => {
      console.log("Server error!!", error);
      throw error;
    });
  })
  .catch((error) => {
    console.log("Mongo DB connection Falied!!", error);
  });
