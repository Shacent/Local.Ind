const express = require("express");
const router = express.Router();
const knexConfig =
    require("../databases/knex")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexConfig);
const crypto = require("crypto");
const getProductSignedUrl = require("../databases/buckets/productImg");
const multer = require("multer");

const generateUUID = () => {
    return crypto.randomUUID();
};

const upload = multer();

router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const [{ count }] = await knex("Products").count("ProductId as count");

        const products = await knex("Products")
            .select("Products.*", "Brands.BrandName", "Categories.CategoryName")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin(
                "Categories",
                "Products.CategoryId",
                "Categories.CategoryId"
            )
            .limit(limit)
            .offset(offset);

        for (const product of products) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }

        const totalPages = Math.ceil(count / limit);

        res.json({
            products,
            pagination: {
                totalItems: count,
                currentPage: page,
                totalPages: totalPages,
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/", upload.single("picture"), async (req, res) => {
    const {
        productName,
        productDescription,
        brandId,
        categoryId,
        unitPrice,
        unitSize,
        unitInStock,
        isAvailable,
        rating,
    } = req.body;

    const picture = req.file;

    try {
        const productId = generateUUID();

        const imgPath = await getProductSignedUrl(
            null,
            productName,
            "create",
            picture
        );
        await knex("Products").insert({
            ProductId: productId,
            ProductName: productName,
            ProductDescription: productDescription,
            BrandId: brandId,
            CategoryId: categoryId,
            UnitPrice: unitPrice,
            UnitSize: unitSize,
            UnitInStock: unitInStock,
            isAvailable: isAvailable,
            Picture: imgPath,
            Rating: rating || 0,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        const newProduct = await knex("Products")
            .select("Products.*", "Brands.BrandName", "Categories.CategoryName")
            .where("Products.ProductId", productId)
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin(
                "Categories",
                "Products.CategoryId",
                "Categories.CategoryId"
            )
            .first();
        res.json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/:ProductId", async (req, res) => {
    const { ProductId } = req.params;
    try {
        const product = await knex("Products")
            .select("Products.*", "Brands.BrandName", "Categories.CategoryName")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin(
                "Categories",
                "Products.CategoryId",
                "Categories.CategoryId"
            )
            .where("ProductId", ProductId)
            .first();
        const imgUrl = await getProductSignedUrl(
            product.Picture,
            product.ProductName,
            "read"
        );
        product.ImgUrl = imgUrl;
        if (!product) {
            return res.status(404).send("Product not found");
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/brand/:BrandName", async (req, res) => {
    const { BrandName } = req.params;
    try {
        const products = await knex("Products")
            .select("Products.*", "Brands.BrandName", "Categories.CategoryName")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin(
                "Categories",
                "Products.CategoryId",
                "Categories.CategoryId"
            )
            .where("Brands.BrandName", BrandName);
        for (const product of products) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        if (!products) {
            return res.status(404).send("Product not found");
        }
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/category/:CategoryName", async (req, res) => {
    const { CategoryName } = req.params;
    try {
        const products = await knex("Products")
            .select("Products.*", "Brands.BrandName", "Categories.CategoryName")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin(
                "Categories",
                "Products.CategoryId",
                "Categories.CategoryId"
            )
            .where("Categories.CategoryName", CategoryName);
        for (const product of products) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        if (!products) {
            return res.status(404).send("Product not found");
        }
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/:ProductId", upload.single("picture"), async (req, res) => {
    const productId = req.params.ProductId;
    const {
        productName,
        productDescription,
        categoryId,
        unitPrice,
        unitSize,
        unitInStock,
        isAvailable,
    } = req.body;

    const picture = req.file;

    const fieldsToUpdate = {};
    const imgPath = await getProductSignedUrl(
        null,
        productName,
        "create",
        picture
    );

    if (productName) fieldsToUpdate.ProductName = productName;
    if (productDescription)
        fieldsToUpdate.ProductDescription = productDescription;
    if (categoryId) fieldsToUpdate.CategoryId = categoryId;
    if (unitPrice) fieldsToUpdate.UnitPrice = unitPrice;
    if (unitSize) fieldsToUpdate.UnitSize = unitSize;
    if (unitInStock) fieldsToUpdate.UnitInStock = unitInStock;
    if (isAvailable) fieldsToUpdate.isAvailable = isAvailable;
    if (picture) fieldsToUpdate.Picture = imgPath;

    try {
        const updatedCount = await knex("Products")
            .where("ProductId", productId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("product not found");
        }
        const updatedshipper = await knex("Products")
            .where("ProductId", productId)
            .first();
        res.json(updatedshipper);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:ProductId", async (req, res) => {
    const productId = req.params.ProductId;

    try {
        const deletedCount = await knex("Products")
            .where("ProductId", productId)
            .del();
        if (deletedCount === 0) {
            return res.status(404).send("Product not found");
        }
        res.status(200).send("Product deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;
