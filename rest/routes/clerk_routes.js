const Express = require("express");
const router = Express.Router();
const clerk_controller = require("../controllers/clerk_controller");
const auth_actions = require("../../utils/auth_actions");

router.post("/login-clerk", clerk_controller.login_clerk);

// Route for verifing the citizen token
router.post(
  "/verify-clerk-token",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.verify_clerk_token
);
// Route for getting applications having today as slot
router.get(
  "/get-todays-applications",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.get_todays_applications
);
// Route for getting previous applications
router.get(
  "/get-past-applications",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.get_past_applications
);
// Route for changing online status
router.post(
  "/change-online-status",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.change_online_status
);
// Route for getting citizen submitted form data
router.post(
  "/get-submitted-form",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.get_submitted_data
);
// Route for updating application's joined_online status
router.post(
  "/set-application-joined-online",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.set_application_joined_online
);
// Route for issuing the ceritificates
router.post(
  "/issue-certificate",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.issue_certificate
);
// Route for rejecting the application
router.post(
  "/reject-application",
  (req, res, next) => {
    req.body.role = "clerk";
    next();
  },
  auth_actions.verify_token,
  clerk_controller.reject_application
);
module.exports = router;
