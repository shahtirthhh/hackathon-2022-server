const Express = require("express");
const router = Express.Router();

const aadhar_controller = require("../controllers/aadhar_controller");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const aadhar_storage = multer.diskStorage({
  destination: "aadhar-data/", // Specify the destination directory
  filename: function (req, file, cb) {
    const name = req.body.aadharNumber.replace(/\s+/g, "_");
    const timestamp = Date.now();
    const ext = file.originalname.split(".").pop();
    const filename = `${name}_${timestamp}.${ext}`;
    cb(null, filename);
  },
});

const aadhar_upload = multer({ storage: aadhar_storage });

router.post("/generate-aadhar-otp", aadhar_controller.generate_aadhar_otp);
router.post("/verify-aadhar-otp", aadhar_controller.verify_aadhar_otp);
router.post(
  "/add-new-aadhar",
  aadhar_upload.single("photo"),
  aadhar_controller.add_new_aadhar
);

module.exports = router;
