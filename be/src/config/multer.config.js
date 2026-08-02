import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files:5, // Giới hạn số lượng tệp là 5
        fileSize: 10 * 1024 * 1024, // Giới hạn kích thước tệp là 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const err = new Error("File type not allowed");
            err.code = "INVALID_FILE_TYPE"; // custom code để phân biệt ở route
            cb(err, false);
        }
    }
});

export default upload;