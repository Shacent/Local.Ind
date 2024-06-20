const express = require("express");
const router = express.Router();
const knexConfig =
    require("../databases/knex")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexConfig);
const crypto = require("crypto");
const getBrandSignedUrl = require("../databases/buckets/brandLogo");
const multer = require("multer");

const generateUUID = () => {
    return crypto.randomUUID();
};

const upload = multer();

router.get("/", async (req, res) => {
    try {
        const brands = await knex("Brands").select("*");

        for (const brand of brands) {
            const logoUrl = await getBrandSignedUrl(
                brand.Logo,
                brand.BrandName,
                "read"
            );
            brand.LogoUrl = logoUrl;
        }

        res.json(brands);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/", upload.single("logo"), async (req, res) => {
    const { brandName, address } = req.body;
    const logo = req.file;

    try {
        const brandId = generateUUID();
        const logoPath = await getBrandSignedUrl(
            null,
            brandName,
            "create",
            logo
        );

        await knex("Brands").insert({
            BrandId: brandId,
            Address: address,
            BrandName: brandName,
            Logo: logoPath, 
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        const newBrand = await knex("Brands").where("BrandId", brandId).first();
        res.json(newBrand);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/:BrandId", async (req, res) => {
    const brandId = req.params.BrandId;

    try {
        const brand = await knex("Brands").where("BrandId", brandId).first();
        const logoUrl = await getBrandSignedUrl(
            brand.Logo,
            brand.BrandName,
            "read"
        );
        brand.LogoUrl = logoUrl;

        if (!brand) {
            return res.status(404).send("Brand not found");
        }
        res.json(brand);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/:BrandId", upload.single("logo"), async (req, res) => {
    const brandId = req.params.BrandId;
    const { brandName, address } = req.body;
    const logo = req.file;

    const fieldsToUpdate = {};
    const logoPath = await getBrandSignedUrl(null, brandName, "create", logo);

    if (brandName) fieldsToUpdate.BrandName = brandName;
    if (logo) fieldsToUpdate.Logo = logoPath;
    if (address) fieldsToUpdate.Address = address;
    fieldsToUpdate.UpdatedAt = new Date();

    try {
        const updatedCount = await knex("Brands")
            .where("BrandId", brandId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("Brand not found");
        }
        const updatedBrand = await knex("Brands")
            .where("BrandId", brandId)
            .first();
        const logoUrl = await getBrandSignedUrl(
            updatedBrand.Logo,
            updatedBrand.BrandName,
            "read"
        );
        updatedBrand.LogoUrl = logoUrl;
        res.json(updatedBrand);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:BrandId", async (req, res) => {
    const brandId = req.params.BrandId;

    try {
        const deletedCount = await knex("Brands")
            .where("BrandId", brandId)
            .del();
        if (deletedCount === 0) {
            return res.status(404).send("Brand not found");
        }
        res.status(200).send("Brand deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;
