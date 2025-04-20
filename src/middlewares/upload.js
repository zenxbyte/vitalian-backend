import multer from "multer";
import AWS from "aws-sdk";
import path from "path";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4/; // Allowed file types
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true); // Accept file
    } else {
      cb(new Error("Invalid file type. Only JPG, JPEG, PNG are allowed."));
    }
  },
});

// Function to upload a file to S3
export const uploadFileToS3 = async (file, folderName) => {
  try {
    // Read the file from local storage
    const fileContent = file.buffer;

    // Set up S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME, // Bucket name from environment variables
      Key: `${folderName}/${file.originalname}`, // File path in S3
      Body: fileContent,
      ContentType: file.mimetype, // Set the MIME type of the file
    };

    // Upload the file to S3
    const data = await s3.upload(params).promise();

    // Return the uploaded file URL
    return {
      imgUrl: data.Location, // Public URL of the uploaded file
      imgKey: data.Key, // S3 Key for further operations (if needed)
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file");
  }
};

// Function to delete a single image from S3
export const deleteImageFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
      Key: key, // The key (file path) of the image you want to delete
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    return false;
  }
};

// Function to delete multiple images from S3
export const deleteImagesFromS3 = async (keys) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
      Delete: {
        Objects: keys.map((key) => ({ Key: key })), // Array of objects with 'Key'
        Quiet: false, // Set to true if you don't want a verbose response
      },
    };

    await s3.deleteObjects(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting images from S3:", error);
    return false;
  }
};
