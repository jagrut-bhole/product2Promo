import express from "express";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extented: true, limit: "20kb" }));

app.use(express.static("public"));
app.use(cookieParser());

//importing users
// import userRouter from "./routes/user.route.js";

// app.use("/api/v1/users", userRouter);

export { app };
