import cloudinary from "../config/cloudinary.config.js";

const getResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw"; // Dành cho pdf, zip, docx, xlsx...
};

const uploadFile = async (file, folderName) => {
  return new Promise((resolve, reject) => {
    const resourceType = getResourceType(file.mimetype);

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: `ivanix/${folderName}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );
    stream.end(file.buffer);
  });
};

const uploadFiles = async (files, folderName) => {
  const uploadPromises = files.map(async (file, index) => {
    const { url, public_id } = await uploadFile(file, folderName);
    return {
      file_url: url,
      file_public_id: public_id,
      file_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      display_order: index,
    };
  });
  return Promise.all(uploadPromises);
};

export default { uploadFile, uploadFiles };
