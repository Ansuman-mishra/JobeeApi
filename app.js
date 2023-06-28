const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const app = express();

const connectDatabase = require("./config/database");
const errorMiddleware = require("./middlewares/error");
const ErrorHandler = require("./utils/errorHandler");
//Configuration for dotenv
dotenv.config({ path: "./config/config.env" });

// Handling Uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log(`Error :>> ${err.message}`);
    console.log(`Shutting down due to uncaught exception`);
    process.exit(1);
});

//connecting to database
connectDatabase();

// Setup body parser
app.use(express.json());

//Set cookie parser
app.use(cookieParser());

// Handle file uploads
app.use(fileUpload());
// Importing all routes

const jobs = require("./routes/jobs");
const auth = require("./routes/auth");
const user = require("./routes/user");

app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);
//Handle unhandled Routes
app.all("*", (req, res, next) => {
    next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

app.use(errorMiddleware);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

//Handling Unhandled Promise Rejection

process.on("unhandledRejection", (err) => {
    console.log(`Error : ${err.message}`);
    console.log("Shutting down the server due to Unhandled promise rejection.");
    server.close(() => {
        process.exit(1);
    });
});
