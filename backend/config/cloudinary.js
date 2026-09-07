import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("Cloudinary configured:", {
  cloud_name: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: Boolean(process.env.CLOUDINARY_API_KEY),
  api_secret: Boolean(process.env.CLOUDINARY_API_SECRET),
});

export const uploadOnCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("File buffer is missing"));
    }

    // Image ya video identify karo
    const resourceType = mimetype?.startsWith("video/")
      ? "video"
      : "image";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "social-feed",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);
          return reject(error);
        }

        console.log("Cloudinary upload successful:", {
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};