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
        const shippers = await knex("Shippers").select("*");
        res.json(shippers);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/", async (req, res) => {
    const { companyName, phone } = req.body;

    try {
        const shipperId = generateUUID();
        await knex("Shippers").insert({
            ShipperId: shipperId,
            CompanyName: companyName,
            Phone: phone,
        });

        const newShipper = await knex("Shippers")
            .where("ShipperId", shipperId)
            .first();
        res.json(newShipper);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/:shipperId", async (req, res) => {
    const shipperId = req.params.shipperId;

    try {
        const shipper = await knex("Shippers")
            .where("ShipperId", shipperId)
            .first();
        if (!shipper) {
            return res.status(404).send("shipper not found");
        }
        res.json(shipper);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/:ShipperId", async (req, res) => {
    const shipperId = req.params.ShipperId;
    const { shipperName, companyName, phone } = req.body;

    const fieldsToUpdate = {};
    if (shipperName) fieldsToUpdate.ShipperName = shipperName;
    if (companyName) fieldsToUpdate.CompanyName = companyName;
    if (phone) fieldsToUpdate.Phone = phone;

    try {
        const updatedCount = await knex("Shippers")
            .where("ShipperId", shipperId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("shipper not found");
        }
        const updatedshipper = await knex("Shippers")
            .where("ShipperId", shipperId)
            .first();
        res.json(updatedshipper);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:ShipperId", async (req, res) => {
    const shipperId = req.params.ShipperId;

    try {
        const deletedCount = await knex("Shippers")
            .where("ShipperId", shipperId)
            .del();
        if (deletedCount === 0) {
            return res.status(404).send("shipper not found");
        }
        res.status(200).send("shipper deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;
