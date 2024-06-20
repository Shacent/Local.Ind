const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
    projectId: "lokal-ind",
    keyFilename: "./serviceAccount/lokal-ind-2fe827816c33.json",
});

const bucketName = "lokalind-img-bucket";
const defaultLogoName = "product-image/default/default-brand.png";

const getProductSignedUrl = async (
    imgPath,
    productName,
    action = "read",
    picture = null
) => {
    const bucket = storage.bucket(bucketName);
    let file;

    if (action === "create" && picture) {
        const productFolder = `product-image/${productName}`;
        const fileName = `${productFolder}/${Date.now()}_${
            picture.originalname
        }`;
        file = bucket.file(fileName);

        await file.save(picture.buffer, {
            metadata: { contentType: picture.mimetype },
        });

        return fileName;
    } else {
        const fileName = imgPath || defaultLogoName;
        file = bucket.file(fileName);
    }

    const options = {
        version: "v4",
        action,
        expires: Date.now() + 15 * 60 * 1000, 
    };

    const [signedUrl] = await file.getSignedUrl(options);
    return signedUrl;
};

module.exports = getProductSignedUrl;
