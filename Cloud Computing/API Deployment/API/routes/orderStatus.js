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
        const orderStatus = await knex("OrderStatus").select("*");
        res.json(orderStatus);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/", async (req, res) => {
    const { statusName } = req.body;

    try {
        const orderStatusId = generateUUID();
        await knex("OrderStatus").insert({
            OrderStatusId: orderStatusId,
            StatusName: statusName,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
        });

        const newShipper = await knex("OrderStatus")
            .where("OrderStatusId", orderStatusId)
            .first();
        res.json(newShipper);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/:orderStatusId", async (req, res) => {
    const orderStatusId = req.params.orderStatusId;

    try {
        const shipper = await knex("OrderStatus")
            .where("OrderStatusId", orderStatusId)
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

router.patch("/:OrderStatusId", async (req, res) => {
    const orderStatusId = req.params.OrderStatusId;
    const { statusName } = req.body;

    const fieldsToUpdate = {};
    if (statusName) fieldsToUpdate.StatusName = statusName;
    fieldsToUpdate.UpdatedAt = new Date();

    try {
        const updatedCount = await knex("OrderStatus")
            .where("OrderStatusId", orderStatusId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("shipper not found");
        }
        const updatedshipper = await knex("OrderStatus")
            .where("OrderStatusId", orderStatusId)
            .first();
        res.json(updatedshipper);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:OrderStatusId", async (req, res) => {
    const orderStatusId = req.params.OrderStatusId;

    try {
        const deletedCount = await knex("OrderStatus")
            .where("OrderStatusId", orderStatusId)
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
