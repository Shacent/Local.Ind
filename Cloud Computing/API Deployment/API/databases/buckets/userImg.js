const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
    projectId: "lokal-ind",
    keyFilename: "./serviceAccount/lokal-ind-2fe827816c33.json",
});

const bucketName = "lokalind-img-bucket";
const fileName = "user-picture/user.jpg";

const getSignedUrl = async () => {
    const options = {
        version: "v4", // Using the latest version of signed URLs
        action: "read", // Specify the desired action (e.g., 'read', 'write', 'delete')
        expires: Date.now() + 15 * 60 * 1000, // Expiration time (e.g., 15 minutes from now)
    };

    // Get a reference to the file
    const file = storage.bucket(bucketName).file(fileName);

    // Generate the signed URL
    const [signedUrl] = await file.getSignedUrl(options);

    return signedUrl;
};

module.exports = getSignedUrl;
