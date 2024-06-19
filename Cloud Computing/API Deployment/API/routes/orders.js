const express = require("express");
const router = express.Router();
const knexConfig =
    require("../databases/knex")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexConfig);
const authMiddleware = require("../auth/middleware/authMiddleware");
const crypto = require("crypto");
const getProductSignedUrl = require("../databases/buckets/productImg");

const generateUUID = () => {
    return crypto.randomUUID();
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { freight, paymentId, orderStatusId, shipperId, cartId } = req.body;
        const customerId = req.customerId;

        const product = await knex("Products")
        .select("ProductId", "UnitPrice")
        .where("ProductId", (knex) => {
            knex.select("ProductId")
                .from("Cart")
                .where("IsActive","true")
                .where("CartId", cartId);
        })
        .first();

        if (!product) {
            return res
                .status(404)
                .json({ error: "Product not found in the cart" });
        }

        const cartItem = await knex("Cart")
            .select("Count")
            .where("CartId", cartId)
            .first();

        if (!cartItem) {
            return res.status(404).json({ error: "Cart item not found" });
        }

        const order = {
            OrderId: generateUUID(),
            CustomerId: customerId,
            PaymentId: paymentId,
            OrderStatusId:
                orderStatusId || "797708fc-0203-48d5-9d55-092e0a0c0c17",
            ShipperId: shipperId,
            Freight: freight || 1,
            OrderDate: new Date(),
            ShipDate: addDays(new Date(), 1),
            ShipLimitDate: addDays(new Date(), 3),
            PaymentDate: new Date(),
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            CartId: cartId,
            ProductId: product.ProductId,
            Price: product.UnitPrice,
            Quantity: cartItem.Count,
        };

        await knex("Orders").insert(order);

        const Total = order.Price * order.Quantity;

        await knex("Cart")
            .where("CartId", cartId)
            .update({ IsActive: false });
        res.status(201).json({
            message: "Kindly wait until the order is arive",
            order,
            Total,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const order = await knex("Orders")
            .select(
                "Orders.*",
                "Customers.FullName",
                "Payments.PaymentType",
                "OrderStatus.StatusName",
                "Shippers.CompanyName",
                "Products.ProductName",
                "Products.Picture"
            )
            .leftJoin("Customers", "Orders.CustomerId", "Customers.CustomerId")
            .leftJoin("Payments", "Orders.PaymentId", "Payments.PaymentId")
            .leftJoin(
                "OrderStatus",
                "Orders.OrderStatusId",
                "OrderStatus.OrderStatusId"
            )
            .leftJoin("Shippers", "Orders.ShipperId", "Shippers.ShipperId")
            .leftJoin("Products", "Orders.ProductId", "Products.ProductId");
        for (const item of order) {
            item.Total = item.Price * item.Quantity;
        }
        for (const product of order) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/process", authMiddleware, async (req, res) => {
    const customerId = req.customerId;

    try {
        const order = await knex("Orders")
            .select(
                "Orders.*",
                "Customers.FullName",
                "Payments.PaymentType",
                "OrderStatus.StatusName",
                "Shippers.CompanyName",
                "Products.ProductName",
                "Products.Picture"
            )
            .leftJoin("Customers", "Orders.CustomerId", "Customers.CustomerId")
            .leftJoin("Payments", "Orders.PaymentId", "Payments.PaymentId")
            .leftJoin(
                "OrderStatus",
                "Orders.OrderStatusId",
                "OrderStatus.OrderStatusId"
            )
            .leftJoin("Shippers", "Orders.ShipperId", "Shippers.ShipperId")
            .leftJoin("Products", "Orders.ProductId", "Products.ProductId")
            .where({
                "Orders.CustomerId": customerId,
                "OrderStatus.StatusName": "Processing",
            });
        if (order.length === 0) {
            return res.status(404).send("order not found");
        }
        for (const item of order) {
            item.Total = item.Price * item.Quantity;
        }
        for (const product of order) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/finished", authMiddleware, async (req, res) => {
    const customerId = req.customerId;

    try {
        const order = await knex("Orders")
            .select(
                "Orders.*",
                "Customers.FullName",
                "Payments.PaymentType",
                "OrderStatus.StatusName",
                "Shippers.CompanyName",
                "Products.ProductName",
                "Products.Picture"
            )
            .leftJoin("Customers", "Orders.CustomerId", "Customers.CustomerId")
            .leftJoin("Payments", "Orders.PaymentId", "Payments.PaymentId")
            .leftJoin(
                "OrderStatus",
                "Orders.OrderStatusId",
                "OrderStatus.OrderStatusId"
            )
            .leftJoin("Shippers", "Orders.ShipperId", "Shippers.ShipperId")
            .leftJoin("Products", "Orders.ProductId", "Products.ProductId")
            .where({
                "Orders.CustomerId": customerId,
                "OrderStatus.StatusName": "Finished",
            });
        if (order.length === 0) {
            return res
                .status(404)
                .send("No finished orders found for this customer");
        }
        for (const item of order) {
            item.Total = item.Price * item.Quantity;
        }
        for (const product of order) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/finishOrder", authMiddleware, async (req, res) => {
    const { orderId } = req.body;

    const fieldsToUpdate = {};
    fieldsToUpdate.OrderStatusId = "bd9fe794-365c-4f1a-b74c-c3d1e2643b13";

    try {
        const updatedCount = await knex("Orders")
            .where("OrderId", orderId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("Order not found");
        }
        res.json({ message: "Order Finished" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;
