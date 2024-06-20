const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
    projectId: "lokal-ind",
    keyFilename: "./serviceAccount/lokal-ind-2fe827816c33.json",
});

const bucketName = "lokalind-img-bucket";
const fileName = "user-picture/user.jpg";

const getSignedUrl = async () => {
    const options = {
        version: "v4",
        action: "read", 
        expires: Date.now() + 15 * 60 * 1000, 
    };

    // Get a reference to the file
    const file = storage.bucket(bucketName).file(fileName);

    // Generate the signed URL
    const [signedUrl] = await file.getSignedUrl(options);

    return signedUrl;
};

module.exports = getSignedUrl;
