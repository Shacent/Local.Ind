const express = require("express");
const router = express.Router();
const recommendationService = require("../AI/recommendationService");

let data, vectorizer, tfidfMatrix, df;

(async function initializeData() {
    try {
        data = await recommendationService.fetchDataFromDB();
        ({ vectorizer, tfidfMatrix, df } = await recommendationService.preprocessData(data));
        console.log("Data initialized successfully");
    } catch (error) {
        console.error("Error initializing data:", error);
    }
})();

router.get("/", async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
        if (!data || !vectorizer || !tfidfMatrix || !df) {
            return res.status(503).json({ error: "Service is initializing. Please try again later." });
        }

        let recommendedIds = recommendationService.getRecommendations(
            query,
            vectorizer,
            tfidfMatrix,
            df
        );

        if (recommendedIds[0] === "barang tidak ditemukan") {
            recommendedIds = recommendationService.getRecommendations(
                query,
                vectorizer,
                tfidfMatrix,
                df,
                5,
                true  // Set noItemsFound to true
            );
        }

        if (recommendedIds[0] === "barang tidak ditemukan") {
            return res.json({ product: [], message: "No similar items found" });
        }

        const productDetails = await recommendationService.getProductDetailsByIds(recommendedIds);
        res.json({ product: productDetails });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({
            error: "An error occurred while processing your request",
        });
    }
});
module.exports = router;