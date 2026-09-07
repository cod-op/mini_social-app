import multer from "multer";


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG, WEBP, GIF, MP4, WEBM and MOV files are allowed."
      ),
      false
    );
  }
};

export const upload = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum 20 MB
    fileSize: 20 * 1024 * 1024,
  },
});