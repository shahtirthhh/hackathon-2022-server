require("dotenv/config");
const fs = require("fs");
const { Op } = require("sequelize");

const CitizenAccount = require("../../models/citizen/citizen_account_model");
const Aadhar = require("../../models/aadhar_model");
const VALIDATORS = require("../../utils/validators");
const HASH_OPERATIONS = require("../../utils/hash_operations");
const auth_actions = require("../../utils/auth_actions");
const static_data = require("../../data/data");
const CitizenApplications = require("../../models/citizen/citizen_applications_model");
const BirthForm = require("../../models/forms/BirthForm_model");
const MarriageForm = require("../../models/forms/MarriageForm_model");
const DeathForm = require("../../models/forms/DeathForm_model");
const DistrictSlots = require("../../models/slots/district_slots_model");
const SlotDetails = require("../../models/slots/slot_details_model");
const SlotsData = require("../../models/slots/slots_data_model");
const ClerkAccount = require("../../models/clerk/clerk_account_model");
const mailer = require("../../utils/mailer");
const path = require("path");

class CustomResponse {
  constructor(code, message, isError = true, data = undefined) {
    this.code = code;
    this.message = message;
    this.error = isError;
    this.data = data;
  }
}
function getNext3WorkingDays() {
  const result = [];
  const today = new Date();
  let dayCount = 0;

  // Helper function to check if a date is a 2nd or 4th Saturday
  function isSecondOrFourthSaturday(date) {
    const day = date.getDay();
    const dateOfMonth = date.getDate();
    return (
      day === 6 &&
      (Math.floor((dateOfMonth - 1) / 7) === 1 ||
        Math.floor((dateOfMonth - 1) / 7) === 3)
    );
  }

  // Helper function to check if a date is Sunday
  function isSunday(date) {
    return date.getDay() === 0;
  }

  while (result.length < 3) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + dayCount + 1); // Start from tomorrow
    dayCount++;

    if (!isSunday(nextDate) && !isSecondOrFourthSaturday(nextDate)) {
      result.push(nextDate.toDateString());
    }
  }

  return result;
}
const select_clerk_for_slot = async (application, selectedSlot) => {
  const { form_type, district } = application;
  const { date, slot_id } = selectedSlot;

  const department = form_type;
  const clerks = await ClerkAccount.findAll({
    where: {
      department,
      district,
    },
  });
  if (clerks.length === 0) {
    return { found: false };
  }

  const clerkApplicationCounts = await Promise.all(
    clerks.map(async (clerk) => {
      const applicationCount = await SlotsData.count({
        where: {
          slot_id,
          clerk_id: clerk.clerk_id,
          date: date,
        },
      });

      return { clerk, applicationCount };
    })
  );

  clerkApplicationCounts.sort(
    (a, b) => a.applicationCount - b.applicationCount
  );
  const selectedClerk = clerkApplicationCounts[0].clerk;
  return { selectedClerk, found: true };
};
const citizen_controller = {
  register_citizen: async (req, res) => {
    const { aadhar, fullName, password } = req.body;
    if (
      !aadhar ||
      !fullName ||
      !password ||
      !VALIDATORS.aadhar_validator(aadhar) ||
      !VALIDATORS.password_validator(password)
    )
      res
        .status(400)
        .send(new CustomResponse("VALIDATION_ERROR", "Insufficient data"));
    else {
      const account = await CitizenAccount.findByPk(aadhar);
      if (account)
        res
          .status(401)
          .send(
            new CustomResponse(
              "ALREADY_EXISTS",
              `Account with ${aadhar} already exists`
            )
          );
      else {
        const hash = HASH_OPERATIONS.hash_string(password);
        const { email } = await Aadhar.findByPk(aadhar, {
          attributes: ["email"],
        });
        await CitizenAccount.create({
          citizen_id: aadhar,
          fullName,
          email,
          password: hash,
        });
        const mailData = mailer.generate_mail(
          fullName,
          "Good to see you on a way to digitalize India !",
          ""
        );
        mailer.send_mail(
          email,
          "Successful account registration on Hackathon-2022 Project",
          mailData
        );
        res
          .status(201)
          .send(
            new CustomResponse(
              "ACCOUNT_CREATED",
              "Registration completed !",
              false
            )
          );
      }
    }
  },
  login_citizen: async (req, res) => {
    const { email, password } = req.body;
    if (
      !email ||
      !password ||
      !VALIDATORS.email_validator(email) ||
      !VALIDATORS.password_validator(password)
    )
      res
        .status(401)
        .send(
          new CustomResponse(
            "VALIDATION_FAILED",
            "No email or password provided"
          )
        );
    else {
      const citizen = await CitizenAccount.findOne({ where: { email } });
      if (!citizen)
        res
          .status(404)
          .send(
            new CustomResponse(
              "NO_USER_FOUND",
              `No account found with: ${email}`
            )
          );
      else {
        const result = HASH_OPERATIONS.compare_hash(password, citizen.password);
        if (!result)
          res
            .status(401)
            .send(
              new CustomResponse(
                "AUTHENTICATION_ERROR",
                "Email or password is incorrect !"
              )
            );
        else {
          const token = auth_actions.generate_token(
            citizen.email,
            citizen.citizen_id,
            "citizen"
          );
          citizen.password = undefined;
          citizen.createdAt = undefined;
          citizen.updatedAt = undefined;
          const mailData = mailer.generate_mail("", "New login detected !", "");
          mailer.send_mail(
            citizen.email,
            "Your account has a new login.",
            mailData
          );
          res.status(200).send(
            new CustomResponse("LOGIN_SUCCESS", "Login successful !", false, {
              token,
              citizen,
            })
          );
        }
      }
    }
  },
  verify_citizen_token: async (req, res) => {
    let user;
    if (req.body.role === "citizen") {
      user = await CitizenAccount.findOne({ where: { email: req.body.email } });
      user.password = undefined;
      user.createdAt = undefined;
      user.updatedAt = undefined;
    } else {
    }
    // setTimeout(() => {
    res
      .status(200)
      .send(
        new CustomResponse("AUTH_SUCCESS", "Token verified !", false, user)
      );
    // }, 4000);
  },
  submit_birth_form: async (req, res) => {
    const {
      citizen_id,
      childBirthDate,
      childGender,
      childFirstName,
      childMiddleName,
      childLastName,
      placeOfBirth,
      motherAadhar,
      motherReligion,
      motherLiteracy,
      motherAgeAtBirth,
      motherOccupation,
      fatherAadhar,
      fatherReligion,
      fatherLiteracy,
      fatherOccupation,
    } = req.body;
    const { permanentAddProofDOC, marriageCertificateDOC, proofOfBirthDOC } =
      req.files || {};
    if (!permanentAddProofDOC || !marriageCertificateDOC || !proofOfBirthDOC) {
      return res
        .status(400)
        .send(
          new CustomResponse(
            "VALIDATION_ERROR",
            "Required documents for proof could not be found !"
          )
        );
    }
    const delete_saved_files = (files) => {
      Object.keys(files).map((attributeName) => {
        fs.unlink(files[attributeName][0].path, (err) => {
          if (err) console.error("Failed to delete file:", filePath, err);
        });
      });
    };
    {
      if (!VALIDATORS.aadhar_validator(citizen_id)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Citizen aadhar number not found"
            )
          );
      }
      const today = new Date().toDateString();
      const dob = new Date(childBirthDate);
      if (dob >= new Date(today)) {
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Invalid birthdate"));
      }
      if (!["male", "female", "others"].includes(childGender)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Gender is required"));
      }
      if (!VALIDATORS.only_alpha_validator(childFirstName)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "First name is required")
          );
      }
      if (!VALIDATORS.only_alpha_validator(childLastName)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Last name is required")
          );
      }
      if (!VALIDATORS.only_alpha_validator(childMiddleName)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Middle name is required")
          );
      }
      if (!static_data.Gujarat.includes(placeOfBirth)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Birth place required"));
      }
      // Mother validations
      if (!VALIDATORS.aadhar_validator(motherAadhar)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Invalid mother's aadhar")
          );
      }
      if (!static_data.religions.includes(motherReligion)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Religion is required"));
      }

      if (!static_data.education.includes(motherLiteracy)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Literacy is required"));
      }

      if (motherAgeAtBirth >= 100 || motherAgeAtBirth < 18) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Must be between 18 & 100")
          );
      }

      if (!static_data.occupations.includes(motherOccupation)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Occupation is required")
          );
      }
      // Father validations
      if (!VALIDATORS.aadhar_validator(fatherAadhar)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Invalid father's aadhar")
          );
      }
      if (!static_data.religions.includes(fatherReligion)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Religion is required"));
      }
      if (!static_data.education.includes(fatherLiteracy)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(new CustomResponse("VALIDATION_ERROR", "Literacy is required"));
      }
      if (!static_data.occupations.includes(fatherOccupation)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Occupation is required")
          );
      }
      // Document validations
      if (
        !VALIDATORS.image_validator(
          permanentAddProofDOC[0].originalname,
          permanentAddProofDOC[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Must be an img with max 2MB"
            )
          );
      }
      if (
        !VALIDATORS.image_validator(
          marriageCertificateDOC[0].originalname,
          marriageCertificateDOC[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Must be an img with max 2MB"
            )
          );
      }
      if (
        !VALIDATORS.image_validator(
          proofOfBirthDOC[0].originalname,
          proofOfBirthDOC[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Must be an img with max 2MB"
            )
          );
      }
    }
    const citizen = await CitizenAccount.findByPk(citizen_id);
    const { gender: mother } = await Aadhar.findByPk(motherAadhar, {
      attributes: ["gender"],
    });
    const { gender: father } = await Aadhar.findByPk(fatherAadhar, {
      attributes: ["gender"],
    });
    if (!citizen) {
      delete_saved_files(req.files);
      return res
        .status(404)
        .send(
          new CustomResponse("FAKE_ACCOUNT_FOUND", "Fake requests are declined")
        );
    }
    if (mother !== "female" || father !== "male") {
      delete_saved_files(req.files);
      return res
        .status(401)
        .send(
          new CustomResponse("GENDER_CONFLICT", "Parent's genders are invalid")
        );
    }
    const application = {
      citizen_id,
      form_type: "BIRTH",
      district: placeOfBirth,
      holder1: `${childFirstName} ${childMiddleName} ${childLastName}`,
    };
    try {
      const saved_application = await CitizenApplications.create(application);
      const birthForm = { ...req.body };
      birthForm.application_id = saved_application.application_id;

      birthForm.permanentAddProofDOC = permanentAddProofDOC[0].path;
      birthForm.marriageCertificateDOC = marriageCertificateDOC[0].path;
      birthForm.proofOfBirthDOC = proofOfBirthDOC[0].path;

      delete birthForm.email;
      delete birthForm.citizen;
      const saved_form = await BirthForm.create(birthForm);
      await CitizenApplications.update(
        { form_id: saved_form.birth_form_id },
        { where: { application_id: saved_application.application_id } }
      );
      const mailData = mailer.generate_mail(
        citizen.fullName,
        "Birth form submitted",
        ""
      );
      mailer.send_mail(
        citizen.email,
        "Birth form submitted successfully !",
        mailData
      );
      res
        .status(201)
        .send(
          new CustomResponse(
            "BIRTH_FORM_SUBMITTED",
            "Birth form submitted",
            false
          )
        );
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send(new CustomResponse("UNEXPECTED_ERROR", "Something went wrong"));
    }
  },
  submit_marriage_form: async (req, res) => {
    const {
      citizen_id,
      placeOfMarriage,
      dateOfMarriage,
      groomAadhar,
      groomReligion,
      groomDOB,
      groomOccupation,
      brideAadhar,
      brideReligion,
      brideDOB,
      brideOccupation,
    } = req.body;
    const {
      groomSignature,
      brideSignature,
      witnessID,
      witnessSignature,
      priestSignature,
      marriagePhoto1,
      marriagePhoto2,
    } = req.files || {};
    if (
      !groomSignature ||
      !brideSignature ||
      !witnessID ||
      !witnessSignature ||
      !priestSignature ||
      !marriagePhoto1 ||
      !marriagePhoto2
    ) {
      return res
        .status(400)
        .send(
          new CustomResponse(
            "VALIDATION_ERROR",
            "Required documents for proof could not be found !"
          )
        );
    }
    const delete_saved_files = (files) => {
      Object.keys(files).map((attributeName) => {
        fs.unlink(files[attributeName][0].path, (err) => {
          if (err) console.error("Failed to delete file:", filePath, err);
        });
      });
    };
    {
      if (!VALIDATORS.aadhar_validator(citizen_id)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Citizen aadhar is not valid"
            )
          );
      }
      if (!placeOfMarriage || placeOfMarriage.trim().length < 3) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Place of marriage is not valid"
            )
          );
      }
      const today = new Date().toDateString();
      if (new Date(dateOfMarriage) >= new Date(today)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Date of marriage is not valid"
            )
          );
      }
      // Groom validations
      if (!VALIDATORS.aadhar_validator(groomAadhar)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Groom aadhar is not valid")
          );
      }
      if (!static_data.religions.includes(groomReligion)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Groom religion is not valid"
            )
          );
      }
      if (new Date(groomDOB) >= new Date(today)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Groom D.O.B is not valid")
          );
      }
      if (!static_data.occupations.includes(groomOccupation)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Groom occupation is not valid"
            )
          );
      }
      if (
        !VALIDATORS.image_validator(
          groomSignature[0].originalname,
          groomSignature[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Groom sign is not valid")
          );
      }
      // bride validations
      if (!VALIDATORS.aadhar_validator(brideAadhar)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Bride aadhar is not valid")
          );
      }
      if (!static_data.religions.includes(brideReligion)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Bride religion is not valid"
            )
          );
      }
      if (new Date(brideDOB) >= new Date(today)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Bride D.O.B is not valid")
          );
      }
      if (!static_data.occupations.includes(brideOccupation)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Bride oppucation is not valid"
            )
          );
      }
      if (
        !VALIDATORS.image_validator(
          brideSignature[0].originalname,
          brideSignature[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Bride sign is not valid")
          );
      }
      // witness validations
      if (
        !VALIDATORS.image_validator(
          witnessID[0].originalname,
          witnessID[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Witness ID is not valid")
          );
      }
      if (
        !VALIDATORS.image_validator(
          witnessSignature[0].originalname,
          witnessSignature[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Witness sign is not valid")
          );
      }
      // Documents validations
      if (
        !VALIDATORS.image_validator(
          priestSignature[0].originalname,
          priestSignature[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Priest sign is not valid")
          );
      }
      if (
        !VALIDATORS.image_validator(
          marriagePhoto1[0].originalname,
          marriagePhoto1[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Marriage photo 1 is not valid"
            )
          );
      }
      if (
        !VALIDATORS.image_validator(
          marriagePhoto2[0].originalname,
          marriagePhoto2[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Marriage photo 2 is not valid"
            )
          );
      }
    }
    const citizen = await CitizenAccount.findByPk(citizen_id);
    const groom = await Aadhar.findByPk(groomAadhar);
    const bride = await Aadhar.findByPk(brideAadhar);
    if (!citizen) {
      delete_saved_files(req.files);
      return res
        .status(404)
        .send(
          new CustomResponse("FAKE_ACCOUNT_FOUND", "Fake requests are declined")
        );
    }
    if (bride.gender !== "female" || groom.gender !== "male") {
      delete_saved_files(req.files);
      return res
        .status(401)
        .send(
          new CustomResponse(
            "GENDER_CONFLICT",
            "Bride/Groom's gender is invalid"
          )
        );
    }
    const application = {
      citizen_id,
      form_type: "MARRIAGE",
      district: groom.district,
      holder1: `${groom.firstName} ${groom.middleName} ${groom.lastName}`,
      holder2: `${bride.firstName} ${bride.middleName} ${bride.lastName}`,
    };

    try {
      const saved_application = await CitizenApplications.create(application);
      console.log(saved_application);
      const marriageForm = { ...req.body };
      marriageForm.application_id = saved_application.application_id;

      marriageForm.groomSignature = groomSignature[0].path;
      marriageForm.brideSignature = brideSignature[0].path;
      marriageForm.witnessID = witnessID[0].path;
      marriageForm.witnessSignature = witnessSignature[0].path;
      marriageForm.priestSignature = priestSignature[0].path;
      marriageForm.marriagePhoto1 = marriagePhoto1[0].path;
      marriageForm.marriagePhoto2 = marriagePhoto2[0].path;

      delete marriageForm.email;
      delete marriageForm.citizen;
      const saved_form = await MarriageForm.create(marriageForm);
      await CitizenApplications.update(
        { form_id: saved_form.marriage_form_id },
        { where: { application_id: saved_application.application_id } }
      );
      const mailData = mailer.generate_mail(
        citizen.fullName,
        "Marriage form submitted",
        ""
      );
      mailer.send_mail(
        citizen.email,
        "Marriage form submitted successfully !",
        mailData
      );
      res
        .status(201)
        .send(
          new CustomResponse(
            "MARRIAGE_FORM_SUBMITTED",
            "Marriage form submitted",
            false
          )
        );
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send(new CustomResponse("UNEXPECTED_ERROR", "Something went wrong"));
    }
  },
  submit_death_form: async (req, res) => {
    const {
      citizen_id,
      placeOfDeath,
      dateOfDeath,
      deceasedAadhar,
      deathReason,
      fillerAadhar,
      fillerRelation,
    } = req.body;
    const { crematoriumDeclaration, hospitalDeclaration } = req.files || {};
    if (!crematoriumDeclaration || !hospitalDeclaration) {
      return res
        .status(400)
        .send(
          new CustomResponse(
            "VALIDATION_ERROR",
            "Required documents for proof could not be found !"
          )
        );
    }
    const delete_saved_files = (files) => {
      Object.keys(files).map((attributeName) => {
        fs.unlink(files[attributeName][0].path, (err) => {
          if (err) console.error("Failed to delete file:", filePath, err);
        });
      });
    };
    {
      if (!VALIDATORS.aadhar_validator(citizen_id)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Citizen aadhar is not valid"
            )
          );
      }
      if (!placeOfDeath || placeOfDeath.trim().length < 3) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Place of death is not valid"
            )
          );
      }
      const today = new Date().toDateString();
      if (new Date(dateOfDeath) >= new Date(today)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Date of death is not valid")
          );
      }
      if (!VALIDATORS.aadhar_validator(deceasedAadhar)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Deceased aadhar is not valid"
            )
          );
      }
      if (!static_data.death_reasons.includes(deathReason)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Death reason is not valid")
          );
      }
      if (!VALIDATORS.aadhar_validator(fillerAadhar)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Filler aadhar is not valid")
          );
      }
      if (!static_data.relations.includes(fillerRelation)) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse("VALIDATION_ERROR", "Relation is not valid")
          );
      }
      if (
        !VALIDATORS.image_validator(
          crematoriumDeclaration[0].originalname,
          crematoriumDeclaration[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Crematorium declaration is not valid"
            )
          );
      }
      if (
        !VALIDATORS.image_validator(
          hospitalDeclaration[0].originalname,
          hospitalDeclaration[0].size
        )
      ) {
        delete_saved_files(req.files);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "VALIDATION_ERROR",
              "Hospital declaration is not valid"
            )
          );
      }
    }
    const citizen = await CitizenAccount.findByPk(citizen_id);
    const dead = await Aadhar.findByPk(deceasedAadhar);
    const already_dead = await DeathForm.findOne({ where: { deceasedAadhar } });

    if (already_dead) {
      delete_saved_files(req.files);
      return res
        .status(404)
        .send(
          new CustomResponse(
            "DUMMY_REQ_FOUND",
            "Person is already marked as dead !"
          )
        );
    }
    if (!citizen) {
      delete_saved_files(req.files);
      return res
        .status(404)
        .send(
          new CustomResponse("FAKE_ACCOUNT_FOUND", "Fake requests are declined")
        );
    }
    const application = {
      citizen_id,
      form_type: "DEATH",
      district: dead.district,
      holder1: `${dead.firstName} ${dead.middleName} ${dead.lastName}`,
    };

    try {
      const saved_application = await CitizenApplications.create(application);
      const deathForm = { ...req.body };
      deathForm.application_id = saved_application.application_id;
      deathForm.crematoriumDeclaration = crematoriumDeclaration[0].path;
      deathForm.hospitalDeclaration = hospitalDeclaration[0].path;

      delete deathForm.email;
      delete deathForm.citizen;
      const saved_form = await DeathForm.create(deathForm);
      await CitizenApplications.update(
        { form_id: saved_form.death_form_id },
        { where: { application_id: saved_application.application_id } }
      );
      const mailData = mailer.generate_mail(
        citizen.fullName,
        "Death form submitted",
        ""
      );
      mailer.send_mail(
        citizen.email,
        "Death form submitted successfully !",
        mailData
      );
      res
        .status(201)
        .send(
          new CustomResponse(
            "DEATH_FORM_SUBMITTED",
            "Death form submitted",
            false
          )
        );
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send(new CustomResponse("UNEXPECTED_ERROR", "Something went wrong"));
    }
  },
  get_my_applications: async (req, res) => {
    const { email } = req.body;
    const { citizen_id } = await CitizenAccount.findOne({
      where: { email },
      attributes: ["citizen_id"],
    });
    const citizen_applications = await CitizenApplications.findAll({
      where: { citizen_id },
    });
    await Promise.all(
      citizen_applications.map(async (application) => {
        if (!application.slot) return application;
        const slot_data = await SlotsData.findByPk(application.slot);
        const slot_details = await SlotDetails.findByPk(slot_data.slot_id);
        application["slot"] = {
          id: slot_data.id,
          start: `${slot_data.date} ${slot_details.time.split("-")[0]}`,
          end: `${slot_data.date} ${slot_details.time.split("-")[1]}`,
        };
        return application;
      })
    );
    res.status(200).send(
      new CustomResponse("GOT_APPLICATIONS", "Applications fetched", false, {
        citizen_applications,
      })
    );
  },
  get_free_slots: async (req, res) => {
    const { department, district, application_id, email } = req.body;
    const application = await CitizenApplications.findByPk(application_id);
    const citizen = await CitizenAccount.findOne({ where: { email } });
    // Checking if slot is requested for original application
    if (!application)
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQ", "Fake requests are declined"));

    // Checking if citizen who is requesting slot has submitted the application
    if (application.citizen_id !== citizen.citizen_id)
      return res
        .status(401)
        .send(
          new CustomResponse(
            "CANNOT_TREAT",
            "Citizens can only request for their own applications"
          )
        );
    // Getting slot details for X district and Y department
    const district_wise_slots = await DistrictSlots.findAll({
      where: { district, department },
    });
    const slotIds = district_wise_slots.map((slot) => slot.slot_id);
    // Getting slot timings and max allocation for
    const slots_details = await SlotDetails.findAll({
      where: {
        slot_id: {
          [Op.in]: slotIds,
        },
      },
    });
    const next_3_working_days = getNext3WorkingDays();
    const availableSlots = [];
    // Calculating available free slots
    for (const slotDetail of slots_details) {
      for (const date of next_3_working_days) {
        const currentEntries = await SlotsData.count({
          where: {
            slot_id: slotDetail.slot_id,
            date,
          },
        });
        if (currentEntries < slotDetail.max) {
          availableSlots.push({
            date,
            slot_id: slotDetail.slot_id,
            time: slotDetail.time,
          });
        }
      }
    }
    // Grouping available slots with their ids
    const transformedSlots = availableSlots.reduce((acc, slot) => {
      const { slot_id, time, date } = slot;

      if (!acc[slot_id]) {
        acc[slot_id] = { time, dates: [] };
      }

      acc[slot_id].dates.push(date);

      return acc;
    }, {});
    return res.status(200).send(
      new CustomResponse("SLOTS_FOUND", "Free slots found !", false, {
        free_slots: transformedSlots,
      })
    );
  },
  book_free_slot: async (req, res) => {
    const { application, selectedSlot, email } = req.body;
    const found_application = await CitizenApplications.findByPk(
      application.application_id
    );

    if (
      !found_application ||
      found_application.citizen_id !== application.citizen_id
    )
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQ", "Fake requests are declined"));
    const selection = await select_clerk_for_slot(application, selectedSlot);
    if (!selection.found)
      return res
        .status(404)
        .send(new CustomResponse("NO_CLERKS", "No clerks available"));
    const booked_slot = await SlotsData.create({
      slot_id: selectedSlot.slot_id,
      date: selectedSlot.date,
      clerk_id: selection.selectedClerk.clerk_id,
    });
    const citizen = await CitizenAccount.findByPk(application.citizen_id);
    const mailData = mailer.generate_mail(
      citizen.fullName,
      "A slot has been booked",
      ""
    );
    mailer.send_mail(
      citizen.email,
      `Online verification slot has been booked for ${selectedSlot.date}. Please check in the account for exact timings.`,
      mailData
    );
    await CitizenApplications.update(
      { slot: booked_slot.id, clerk_id: selection.selectedClerk.clerk_id },
      { where: { application_id: found_application.application_id } }
    );

    res.status(201).send(new CustomResponse("SLOT_BOOKED", "Slot booked !"));
  },
  handle_join_request: async (req, res) => {
    const { application, email } = req.body;
    if (!application)
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQ", "Fake requests are declined"));
    const citizen = await CitizenAccount.findOne({ where: { email } });
    if (application.citizen_id !== citizen.citizen_id)
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQ", "Fake requests are declined"));
    const slotData = await SlotsData.findByPk(application.slot.id);
    const slotDetails = await SlotDetails.findByPk(slotData.slot_id);
    application["slot"] = {
      start: `${slotData.date} ${slotDetails.time.split("-")[0]}`,
      end: `${slotData.date} ${slotDetails.time.split("-")[1]}`,
    };
    if (
      new Date().toDateString() !== slotData.date ||
      !(new Date(application.slot.start) <= new Date()) ||
      !(new Date(application.slot.end) > new Date())
    ) {
      return res
        .status(400)
        .send(
          new CustomResponse(
            "TIME_DATE_MISMATCHED",
            "Will be available at the slot timings"
          )
        );
    }
    const clerk = await ClerkAccount.findByPk(application.clerk_id);
    if (!clerk)
      return res
        .status(401)
        .send(
          new CustomResponse(
            "CLERK_NOT_FOUND",
            "Govt. authority details are not valid"
          )
        );
    if (clerk.socket) {
      res.status(200).send(
        new CustomResponse("CLERK_ONLINE", "Clerk is online", false, {
          clerk_socket: clerk.socket,
        })
      );
    } else {
      res
        .status(200)
        .send(
          new CustomResponse(
            "CLERK_OFFLINE",
            "System offline, please try again in few minutes",
            true
          )
        );
    }
  },
  get_certificate: async (req, res) => {
    const { application, email } = req.body;
    let form_data;
    const applicationData = await CitizenApplications.findByPk(
      application.application_id
    );
    if (!applicationData.issued)
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQ", "Fake requests are declined"));
    switch (applicationData.form_type) {
      case "BIRTH":
        form_data = await BirthForm.findByPk(applicationData.form_id);
        break;
      case "MARRIAGE":
        form_data = await MarriageForm.findByPk(applicationData.form_id);
        break;
      case "DEATH":
        form_data = await DeathForm.findByPk(applicationData.form_id);
        break;
      default:
        break;
    }
    res
      .status(200)
      .sendFile(path.join(__dirname, "../../", form_data.certificate));
  },
};

module.exports = citizen_controller;
