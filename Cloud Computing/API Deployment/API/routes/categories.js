const express = require("express");
const router = express.Router();
const knexConfig =
    require("../databases/knex")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexConfig);
const crypto = require("crypto");

const generateUUID = () => {
    return crypto.randomUUID();
};

router.get("/", async (req, res) => {
    try {
        const categories = await knex("Categories").select("*");
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/", async (req, res) => {
    const { categoryName, description } = req.body;

    try {
        const categoryId = generateUUID();
        await knex("Categories").insert({
            CategoryId: categoryId,
            CategoryName: categoryName,
            Description: description,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        const newCategory = await knex("Categories")
            .where("CategoryId", categoryId)
            .first();
        res.json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/:CategoryId", async (req, res) => {
    const categoryId = req.params.CategoryId;

    try {
        const category = await knex("Categories")
            .where("CategoryId", categoryId)
            .first();
        if (!category) {
            return res.status(404).send("Category not found");
        }
        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/:CategoryId", async (req, res) => {
    const categoryId = req.params.CategoryId;
    const { categoryName, description } = req.body;

    const fieldsToUpdate = {};
    if (categoryName) fieldsToUpdate.CategoryName = categoryName;
    if (description) fieldsToUpdate.Description = description;
    fieldsToUpdate.UpdatedAt = new Date();

    try {
        const updatedCount = await knex("Categories")
            .where("CategoryId", categoryId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("Category not found");
        }
        const updatedCategory = await knex("Categories")
            .where("CategoryId", categoryId)
            .first();
        res.json(updatedCategory);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:CategoryId", async (req, res) => {
    const categoryId = req.params.CategoryId;

    try {
        const deletedCount = await knex("Categories")
            .where("CategoryId", categoryId)
            .del();
        if (deletedCount === 0) {
            return res.status(404).send("Category not found");
        }
        res.status(200).send("Category deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;
