const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
    projectId: "lokal-ind",
    keyFilename: "./serviceAccount/lokal-ind-2fe827816c33.json",
});

const bucketName = "lokalind-img-bucket";
const defaultLogoName = "brand-logo/default/default-brand.png";

const getBrandSignedUrl = async (
    logoPath,
    brandName,
    action = "read",
    logo = null
) => {
    const bucket = storage.bucket(bucketName);
    let file;

    if (action === "create" && logo) {
        const brandFolder = `brand-logo/${brandName}`;
        const fileName = `${brandFolder}/${Date.now()}_${logo.originalname}`;
        file = bucket.file(fileName);

        await file.save(logo.buffer, {
            metadata: { contentType: logo.mimetype },
        });

        // Return the newly created file path for later use
        return fileName;
    } else {
        const fileName = logoPath || defaultLogoName;
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

module.exports = getBrandSignedUrl;
