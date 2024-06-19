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
        const payments = await knex("Payments").select("*");
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/", async (req, res) => {
    const { paymentType, idAllow } = req.body;

    try {
        const paymentId = generateUUID();
        await knex("Payments").insert({
            PaymentId: paymentId,
            PaymentType: paymentType,
            idAllow: idAllow,
        });

        const newPayment = await knex("Payments")
            .where("PaymentId", paymentId)
            .first();
        res.json(newPayment);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.get("/:paymentId", async (req, res) => {
    const paymentId = req.params.paymentId;

    try {
        const payment = await knex("Payments")
            .where("PaymentId", paymentId)
            .first();
        if (!payment) {
            return res.status(404).send("payment not found");
        }
        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.patch("/:paymentId", async (req, res) => {
    const paymentId = req.params.paymentId;
    const { paymentType, idAllow } = req.body;

    const fieldsToUpdate = {};
    if (paymentType) fieldsToUpdate.PaymentType = paymentType;
    if (idAllow) fieldsToUpdate.idAllow = idAllow;

    try {
        const updatedCount = await knex("Payments")
            .where("PaymentId", paymentId)
            .update(fieldsToUpdate);
        if (updatedCount === 0) {
            return res.status(404).send("payment not found");
        }
        const updatedpayment = await knex("Payments")
            .where("PaymentId", paymentId)
            .first();
        res.json(updatedpayment);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.delete("/:paymentId", async (req, res) => {
    const paymentId = req.params.paymentId;

    try {
        const deletedCount = await knex("Payments")
            .where("PaymentId", paymentId)
            .del();
        if (deletedCount === 0) {
            return res.status(404).send("payment not found");
        }
        res.status(200).send("payment deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

module.exports = router;
