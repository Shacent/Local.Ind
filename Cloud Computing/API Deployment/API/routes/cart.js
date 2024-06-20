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

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { productId, count } = req.body;
        const customerId = req.customerId;

        const cartItem = {
            CartId: generateUUID(),
            CustomerId: customerId,
            ProductId: productId,
            Count: count,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        };

        await knex("Cart").insert(cartItem);

        res.status(201).json({ message: "Item added to cart" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const Cart = await knex("Cart")
            .select(
                "Cart.*",
                "Products.ProductName",
                "Products.Picture",
                "Products.UnitPrice",
                "Customers.FullName",
                "Brands.BrandName"
            )
            .leftJoin("Products", "Cart.ProductId", "Products.ProductId")
            .leftJoin("Customers", "Cart.CustomerId", "Customers.CustomerId")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId");
        for (const product of Cart) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        res.json(Cart);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/myCart", authMiddleware, async (req, res) => {
    const customerId = req.customerId;

    try {
        const cart = await knex("Cart")
            .select(
                "Cart.*",
                "Products.ProductName",
                "Products.Picture",
                "Products.UnitPrice",
                "Customers.FullName",
                "Brands.BrandName"
            )
            .leftJoin("Products", "Cart.ProductId", "Products.ProductId")
            .leftJoin("Customers", "Cart.CustomerId", "Customers.CustomerId")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .where({ "Cart.CustomerId": customerId, "Cart.IsActive": true });
        for (const product of cart) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        if (!cart) {
            return res.status(404).send("Cart not found");
        }
        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/:CartId", authMiddleware, async (req, res) => {
    const cartId = req.params.CartId;
    const { count, isActive } = req.body;

    const fieldsToUpdate = {};
    if (count) fieldsToUpdate.Count = count;
    if (isActive) fieldsToUpdate.isActive = isActive;
    fieldsToUpdate.UpdatedAt = new Date();

    try {
        const updatedCount = await knex("Cart")
            .where("CartId", cartId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("Cart not found");
        }
        const updatedCart = await knex("Cart").where("CartId", cartId).first();
        res.json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:CartId", authMiddleware, async (req, res) => {
    const cartId = req.params.CartId;

    try {
        const deletedCount = await knex("Cart").where("CartId", cartId).del();
        if (deletedCount === 0) {
            return res.status(404).send("Cart not found");
        }
        res.status(200).send("Cart deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});
module.exports = router;
