const Express = require("express");
const router = Express.Router();
const citizen_controller = require("../controllers/citizen_controller");
const auth_actions = require("../../utils/auth_actions");

const multer = require("multer");

const birth_form_storage = multer.diskStorage({
  destination: "forms-data/birth-forms/", // Specify the destination directory
  filename: function (req, file, cb) {
    let docName;
    if (file.fieldname === "permanentAddProofDOC") docName = "addressProof";
    else if (file.fieldname === "marriageCertificateDOC")
      docName = "marriageProof";
    else if (file.fieldname === "proofOfBirthDOC") docName = "birthProof";
    else return;
    const name = req.body.citizen_id.replace(/[^\d]/g, "_");
    const timestamp = Date.now();
    const ext = file.originalname.split(".").pop();
    const filename = `${name}_${docName}_${timestamp}.${ext}`;
    cb(null, filename);
  },
});
const marriage_form_storage = multer.diskStorage({
  destination: "forms-data/marriage-forms/", // Specify the destination directory
  filename: function (req, file, cb) {
    let docName;
    switch (file.fieldname) {
      case "groomSignature":
        docName = "groomSignature";
        break;
      case "brideSignature":
        docName = "brideSignature";
        break;
      case "witnessID":
        docName = "witnessID";
        break;
      case "witnessSignature":
        docName = "witnessSignature";
        break;
      case "priestSignature":
        docName = "priestSignature";
        break;
      case "marriagePhoto1":
        docName = "marriagePhoto1";
        break;
      case "marriagePhoto2":
        docName = "marriagePhoto2";
        break;

      default:
        return;
    }

    const name = req.body.citizen_id.replace(/[^\d]/g, "_");
    const timestamp = Date.now();
    const ext = file.originalname.split(".").pop();
    const filename = `${name}_${docName}_${timestamp}.${ext}`;
    cb(null, filename);
  },
});
const death_form_storage = multer.diskStorage({
  destination: "forms-data/death-forms/", // Specify the destination directory
  filename: function (req, file, cb) {
    let docName;
    switch (file.fieldname) {
      case "crematoriumDeclaration":
        docName = "crematoriumDeclaration";
        break;
      case "hospitalDeclaration":
        docName = "hospitalDeclaration";
        break;
      default:
        return;
    }

    const name = req.body.citizen_id.replace(/[^\d]/g, "_");
    const timestamp = Date.now();
    const ext = file.originalname.split(".").pop();
    const filename = `${name}_${docName}_${timestamp}.${ext}`;
    cb(null, filename);
  },
});

const birth_form_uploads = multer({ storage: birth_form_storage });
const marriage_form_uploads = multer({ storage: marriage_form_storage });
const death_form_uploads = multer({ storage: death_form_storage });

router.post("/register-citizen", citizen_controller.register_citizen);
router.post("/login-citizen", citizen_controller.login_citizen);

// Route for verifing the citizen token
router.post(
  "/verify-citizen-token",
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.verify_citizen_token
);
// Route for submitting birth form
router.post(
  "/submit-birth-form",
  birth_form_uploads.fields([
    { name: "permanentAddProofDOC", maxCount: 1 },
    { name: "marriageCertificateDOC", maxCount: 1 },
    { name: "proofOfBirthDOC", maxCount: 1 },
  ]),
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.submit_birth_form
);
// Route for submitting marriage form
router.post(
  "/submit-marriage-form",
  marriage_form_uploads.fields([
    { name: "groomSignature", maxCount: 1 },
    { name: "brideSignature", maxCount: 1 },
    { name: "witnessID", maxCount: 1 },
    { name: "witnessSignature", maxCount: 1 },
    { name: "priestSignature", maxCount: 1 },
    { name: "marriagePhoto1", maxCount: 1 },
    { name: "marriagePhoto2", maxCount: 1 },
  ]),
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.submit_marriage_form
);
// Route for submitting death form
router.post(
  "/submit-death-form",
  death_form_uploads.fields([
    { name: "crematoriumDeclaration", maxCount: 1 },
    { name: "hospitalDeclaration", maxCount: 1 },
  ]),
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.submit_death_form
);
// Route for getting applications
router.get(
  "/my-applications",
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.get_my_applications
);
// Route for getting free slots
router.post(
  "/get-free-slots",
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.get_free_slots
);
// Route for booking free slot
router.post(
  "/book-free-slot",
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.book_free_slot
);
// Route for handeling join req by citizen
router.post(
  "/join-request-by-citizen",
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.handle_join_request
);
// Route for getting certificate
router.post(
  "/get-certificate",
  (req, res, next) => {
    req.body.role = "citizen";
    next();
  },
  auth_actions.verify_token,
  citizen_controller.get_certificate
);

module.exports = router;
