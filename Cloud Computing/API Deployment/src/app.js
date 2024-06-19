const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");

const brandsRoutes = require("../API/routes/brands");
const categoriesRoutes = require("../API/routes/categories");
const productsRoutes = require("../API/routes/products");
const shippersRoutes = require("../API/routes/shippers");
const paymentsRoutes = require("../API/routes/payments");
const orderStatusRoutes = require("../API/routes/orderStatus");
const authRoutes = require("../API/routes/auth");
const cartRoutes = require("../API/routes/cart");
const wishlistRoutes = require("../API/routes/wishlist");
const orderRoutes = require("../API/routes/orders");
const recommendationRoutes = require("../API/routes/recommendation");

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header(
            "Acces-Control-Allow-Method",
            "PUT, POST, PATCH, DELETE, GET"
        );
        return res.status(200).json({});
    }
    next();
});

app.use("/brands", brandsRoutes);
app.use("/categories", categoriesRoutes);
app.use("/products", productsRoutes);
app.use("/shippers", shippersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/orderStatus", orderStatusRoutes);
app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/orders", orderRoutes);
app.use("/recommendation",recommendationRoutes);

app.use((req, res, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
});

module.exports = app;
