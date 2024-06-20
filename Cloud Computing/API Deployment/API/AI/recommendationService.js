const natural = require("natural");
const tf = require("@tensorflow/tfjs");
const knexConfig = require("../databases/knex")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexConfig);
const getProductSignedUrl = require("../databases/buckets/productImg");

async function fetchDataFromDB() {
    try {
        return await knex
            .select("ProductId", "ProductName", "CategoryName", "BrandName")
            .from("Products")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin("Categories", "Products.CategoryId", "Categories.CategoryId");
    } catch (error) {
        console.error("Error fetching data from DB:", error);
        throw error;
    }
}

async function preprocessData(data) {
    const df = data.map((row) => ({
        ProductId: row.ProductId,
        combined_features: (
            row.ProductName +
            " " +
            row.CategoryName +
            " " +
            row.BrandName
        ).toLowerCase(),
    }));

    const vectorizer = new natural.TfIdf();
    df.forEach((item) => vectorizer.addDocument(item.combined_features));

    const tfidfMatrix = df.map((item) => {
        const vector = [];
        vectorizer.tfidfs(item.combined_features, (i, measure) =>
            vector.push(measure)
        );
        return vector;
    });

    return { vectorizer, tfidfMatrix, df };
}

function preprocessQuery(query, noItemsFound = false) {
    query = query.replace(/[^a-zA-Z\s]/g, '');
    query = query.replace(/(.)\1+/g, '$1');
    query = query.toLowerCase();

    if (noItemsFound) {
        if (query.includes('exe')) return 'executive';
        if (query.includes('er')) return 'erigo';
        if (query.includes('ei')) return 'eiger';
    }

    return query;
}

function getRecommendations(query, vectorizer, tfidfMatrix, df, topN = 5) {
    query = preprocessQuery(query);
    console.log("Preprocessed query:", query);  

    const exactMatches = df.filter(item => 
        item.combined_features.toLowerCase().includes(query.toLowerCase())
    );

    if (exactMatches.length > 0) {
        console.log("Found exact matches for brand:", exactMatches.length);
        return exactMatches.slice(0, topN).map(item => item.ProductId);
    }

    const queryVector = [];
    vectorizer.tfidfs(query, (i, measure) => queryVector.push(measure));

    const cosineSimQuery = tfidfMatrix.map((vector) => {
        const dotProduct = vector.reduce(
            (sum, val, idx) => sum + val * queryVector[idx],
            0
        );
        const normA = Math.sqrt(
            vector.reduce((sum, val) => sum + val * val, 0)
        );
        const normB = Math.sqrt(
            queryVector.reduce((sum, val) => sum + val * val, 0)
        );
        return dotProduct / (normA * normB) || 0; 
    });

    console.log("Cosine similarities:", cosineSimQuery.slice(0, 5));  

    if (cosineSimQuery.every(score => Math.abs(score) < 1e-10)) {
        console.log("No similar items found.");
        return ["barang tidak ditemukan"];
    }

    const simScores = cosineSimQuery.map((score, index) => ({ index, score }));
    simScores.sort((a, b) => b.score - a.score);

    const recommendations = simScores.slice(0, topN).map((simScore) => ({
        ...df[simScore.index],
        similarity: simScore.score,
    }));

    const idItems = recommendations.map((rec) => rec.ProductId);
    console.log("Recommended IDs:", idItems);
    return idItems;
}

async function getProductDetailsByIds(ids) {
    try {
        const products = await knex("Products")
            .select("Products.*", "Brands.BrandName", "Categories.CategoryName")
            .leftJoin("Brands", "Products.BrandId", "Brands.BrandId")
            .leftJoin("Categories", "Products.CategoryId", "Categories.CategoryId")
            .whereIn("ProductId", ids);

        for (const product of products) {
            const imgUrl = await getProductSignedUrl(
                product.Picture,
                product.ProductName,
                "read"
            );
            product.ImgUrl = imgUrl;
        }
        return products;
    } catch (error) {
        console.error("Error fetching product details:", error);
        throw error;
    }
}

module.exports = {
    fetchDataFromDB,
    preprocessData,
    getRecommendations,
    getProductDetailsByIds,
};