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
        const { productId } = req.body;
        const customerId = req.customerId;

        const wishlistItem = {
            WishlistId: generateUUID(),
            CustomerId: customerId,
            ProductId: productId,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        };

        await knex("Wishlist").insert(wishlistItem);

        res.status(201).json({ message: "Item added to wishlist" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const wishlist = await knex("Wishlist")
            .select(
                "Wishlist.*",
                "Products.ProductName",
                "Products.Picture",
                "Products.UnitPrice",
                "Customers.FullName",
                "Brands.BrandName"
            )
            .leftJoin("Products", "Wishlist.ProductId", "Products.ProductId")
            .leftJoin(
                "Customers",
                "Wishlist.CustomerId",
                "Customers.CustomerId"
            )
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId");
        for (const product of wishlist) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        res.json(wishlist);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/myWishlist", authMiddleware, async (req, res) => {
    const customerId = req.customerId;

    try {
        const wishlist = await knex("Wishlist")
            .select(
                "Wishlist.*",
                "Products.ProductName",
                "Products.Picture",
                "Products.UnitPrice",
                "Customers.FullName",
                "Brands.BrandName"
            )
            .leftJoin("Products", "Wishlist.ProductId", "Products.ProductId")
            .leftJoin(
                "Customers",
                "Wishlist.CustomerId",
                "Customers.CustomerId"
            )
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .where("Wishlist.CustomerId", customerId);
        for (const product of wishlist) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        if (!wishlist) {
            return res.status(404).send("Wishlist not found");
        }
        res.json(wishlist);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:wishListId", authMiddleware, async (req, res) => {
    const wishlistId = req.params.wishListId;

    try {
        const deletedCount = await knex("Wishlist")
            .where("WishlistId", wishlistId)
            .del();
        if (deletedCount === 0) {
            return res.status(404).send("Wishlist not found");
        }
        res.status(200).send("Wishlist deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});
module.exports = router;
