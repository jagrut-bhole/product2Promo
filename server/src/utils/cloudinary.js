import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File Uploaded SuccessFully...", response.url);

    try {
      fs.unlinkSync(localFilePath);
    } catch (unLinkError) {
      console.log("Falied to Delete the local file..", unLinkError);
    }

    return response;
  } catch (error) {
    try {
      fs.unlinkSync(localFilePath);
    } catch (error) {
      console.log("Failed to Delete Local File Path...", error);
    }
    return null;
  }
};

export { uploadOnCloudinary };
