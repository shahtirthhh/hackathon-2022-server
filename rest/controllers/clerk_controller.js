require("dotenv/config");
const fs = require("fs");
const { Op, literal } = require("sequelize");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

const VALIDATORS = require("../../utils/validators");
const HASH_OPERATIONS = require("../../utils/hash_operations");
const auth_actions = require("../../utils/auth_actions");
const ClerkAccount = require("../../models/clerk/clerk_account_model");
const SlotsData = require("../../models/slots/slots_data_model");
const CitizenApplications = require("../../models/citizen/citizen_applications_model");
const SlotDetails = require("../../models/slots/slot_details_model");
const BirthForm = require("../../models/forms/BirthForm_model");
const MarriageForm = require("../../models/forms/MarriageForm_model");
const DeathForm = require("../../models/forms/DeathForm_model");
const Aadhar = require("../../models/aadhar_model");
const mailer = require("../../utils/mailer");
const path = require("path");
const CitizenAccount = require("../../models/citizen/citizen_account_model");
class CustomResponse {
  constructor(code, message, isError = true, data = undefined) {
    this.code = code;
    this.message = message;
    this.error = isError;
    this.data = data;
  }
}

const imageToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    // Check if file exists
    console.log(filePath);
    const absoluteFilePath = path.resolve(filePath);
    console.log(absoluteFilePath);

    // Log the file path for debugging
    console.log("Attempting to read file:", absoluteFilePath);

    // Check if file exists
    if (!fs.existsSync(absoluteFilePath)) {
      return reject(new Error("File does not exist: " + absoluteFilePath));
    }

    // Read the file
    fs.readFile(absoluteFilePath, (err, data) => {
      if (err) {
        return reject(err);
      }

      // Determine the image format
      const extension = path.extname(absoluteFilePath).substring(1);
      // Convert to Base64 string
      const base64String = data.toString("base64");
      // Concatenate with the appropriate data URL scheme
      const dataUrl = `data:image/${extension};base64,${base64String}`;
      resolve(dataUrl);
    });
  });
};
const generate_death_certificate = async (
  templatePath,
  outputPath,
  citizenDetails
) => {
  try {
    // Read the template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Embed the Helvetica font
    const helveticaFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanBoldItalic
    );

    // Get the first page of the template
    const page = pdfDoc.getPage(0);

    // Define text positions and styles
    const fontSize = 10;
    const color = rgb(0, 0, 0);

    // Add citizen details to the PDF
    page.drawText(`${citizenDetails.district}`, {
      x: 280,
      y: 575,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    page.drawText(`${citizenDetails.name}`, {
      x: 120,
      y: 510,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    page.drawText(`${citizenDetails.reason}`, {
      x: 120,
      y: 488,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.dob}`, {
      x: 140,
      y: 466,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.dod}`, {
      x: 145,
      y: 444,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.doi}`, {
      x: 145,
      y: 380,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // Write the generated PDF to the output path
    fs.writeFileSync(outputPath, pdfBytes);

    console.log("Death certificate generated successfully.");
  } catch (error) {
    console.error("Error generating certificate:", error);
  }
};
const generate_birth_certificate = async (
  templatePath,
  outputPath,
  citizenDetails
) => {
  try {
    // Read the template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Embed the Helvetica font
    const helveticaFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanBoldItalic
    );

    // Get the first page of the template
    const page = pdfDoc.getPage(0);

    // Define text positions and styles
    const fontSize = 10;
    const color = rgb(0, 0, 0);

    // Add citizen details to the PDF
    page.drawText(`${citizenDetails.district}`, {
      x: 193,
      y: 562,
      size: 8,
      font: helveticaFont,
      color,
    });

    page.drawText(`${citizenDetails.name}`, {
      x: 105,
      y: 518,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    page.drawText(`${citizenDetails.gender}`, {
      x: 360,
      y: 518,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.dob}`, {
      x: 140,
      y: 497,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.placeOfBirth}`, {
      x: 310,
      y: 497,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.mother}`, {
      x: 153,
      y: 474,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.father}`, {
      x: 150,
      y: 453,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.addressLine}`, {
      x: 80,
      y: 390,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.district}`, {
      x: 80,
      y: 367,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.doi}`, {
      x: 150,
      y: 302,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // Write the generated PDF to the output path
    fs.writeFileSync(outputPath, pdfBytes);

    console.log("Birth certificate generated successfully.");
  } catch (error) {
    console.error("Error generating certificate:", error);
  }
};
const generate_marriage_certificate = async (
  templatePath,
  outputPath,
  citizenDetails
) => {
  try {
    // Read the template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Embed the Helvetica font
    const helveticaFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanBoldItalic
    );

    // Get the first page of the template
    const page = pdfDoc.getPage(0);

    // Define text positions and styles
    const fontSize = 10;
    const color = rgb(0, 0, 0);

    // Add citizen details to the PDF
    page.drawText(`${citizenDetails.district}`, {
      x: 220,
      y: 574,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    page.drawText(`${citizenDetails.groom}`, {
      x: 115,
      y: 509,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.groomReligion}`, {
      x: 380,
      y: 509,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.groomDOB}`, {
      x: 140,
      y: 487,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.bride}`, {
      x: 115,
      y: 422,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.brideReligion}`, {
      x: 380,
      y: 422,
      size: fontSize,
      font: helveticaFont,
      color,
    });
    page.drawText(`${citizenDetails.brideDOB}`, {
      x: 140,
      y: 400,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    page.drawText(`${citizenDetails.doi}`, {
      x: 145,
      y: 335,
      size: fontSize,
      font: helveticaFont,
      color,
    });

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // Write the generated PDF to the output path
    fs.writeFileSync(outputPath, pdfBytes);

    console.log("Marriage certificate generated successfully.");
  } catch (error) {
    console.error("Error generating certificate:", error);
  }
};
const clerk_controller = {
  verify_clerk_token: async (req, res) => {
    let user;
    if (req.body.role === "clerk") {
      user = await ClerkAccount.findOne({ where: { email: req.body.email } });
      user.id = undefined;
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
  login_clerk: async (req, res) => {
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
      const clerk = await ClerkAccount.findOne({ where: { email } });
      if (!clerk)
        res
          .status(404)
          .send(
            new CustomResponse(
              "NO_USER_FOUND",
              `No account found with: ${email}`
            )
          );
      else {
        const result = HASH_OPERATIONS.compare_hash(password, clerk.password);
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
            clerk.email,
            clerk.clerk_id,
            "clerk"
          );
          clerk.password = undefined;
          clerk.createdAt = undefined;
          clerk.updatedAt = undefined;
          res.status(200).send(
            new CustomResponse("LOGIN_SUCESS", "Login successful !", false, {
              token,
              clerk,
            })
          );
        }
      }
    }
  },
  get_todays_applications: async (req, res) => {
    const { email } = req.body;
    const clerk = await ClerkAccount.findOne({ where: { email } });
    const todays_slots = await SlotsData.findAll({
      where: { date: new Date().toDateString(), clerk_id: clerk.clerk_id },
    });
    const slotIds = todays_slots.map((slot) => slot.id);
    const todays_applications = await CitizenApplications.findAll({
      where: {
        slot: {
          [Op.in]: slotIds,
        },
        clerk_id: clerk.clerk_id,
      },
    });
    await Promise.all(
      todays_applications.map(async (application) => {
        if (!application.slot) return application;
        const slot_data = await SlotsData.findByPk(application.slot);
        const slot_details = await SlotDetails.findByPk(slot_data.slot_id);
        application["slot"] = {
          start: `${slot_data.date} ${slot_details.time.split("-")[0]}`,
          end: `${slot_data.date} ${slot_details.time.split("-")[1]}`,
        };
        if (
          new Date() >= new Date(application.slot.end) &&
          !application.issued &&
          !application.rejection_reason &&
          !application.joined_online
        ) {
          application.joined_online = false;
          application.rejection_reason = "Did not join on the slot";
          await CitizenApplications.update(
            {
              joined_online: false,
              rejection_reason: "Did not join on the slot",
              issued: false,
            },
            { where: { application_id: application.application_id } }
          );
        }
        return application;
      })
    );
    res
      .status(200)
      .send(
        new CustomResponse(
          "APPLICATIONS_FOUND",
          "Applications fetched !",
          false,
          { todays_applications }
        )
      );
  },
  get_past_applications: async (req, res) => {
    const { email } = req.body;
    const clerk = await ClerkAccount.findOne({ where: { email } });
    const todaysDate = new Date();
    todaysDate.setHours(0, 0, 0, 0);

    const formattedDate = todaysDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    const pastSlots = await SlotsData.findAll({
      where: {
        clerk_id: clerk.clerk_id,
        [Op.and]: [
          literal(
            `STR_TO_DATE(LEFT(date, 10), '%a %b %d') < '${formattedDate}'`
          ),
        ],
      },
    });
    const slotIds = pastSlots.map((slot) => slot.id);
    const todays_applications = await CitizenApplications.findAll({
      where: {
        slot: {
          [Op.in]: slotIds,
        },
        clerk_id: clerk.clerk_id,
      },
    });
    await Promise.all(
      todays_applications.map(async (application) => {
        if (!application.slot) return application;
        const slot_data = await SlotsData.findByPk(application.slot);
        const slot_details = await SlotDetails.findByPk(slot_data.slot_id);
        application["slot"] = {
          start: `${slot_data.date} ${slot_details.time.split("-")[0]}`,
          end: `${slot_data.date} ${slot_details.time.split("-")[1]}`,
        };
        if (
          new Date() >= new Date(application.slot.end) &&
          !application.issued &&
          !application.rejection_reason &&
          !application.joined_online
        ) {
          application.joined_online = false;
          application.rejection_reason = "Did not join on the slot";
          await CitizenApplications.update(
            {
              joined_online: false,
              rejection_reason: "Did not join on the slot",
              issued: false,
            },
            { where: { application_id: application.application_id } }
          );
        }
        return application;
      })
    );
    res
      .status(200)
      .send(
        new CustomResponse(
          "APPLICATIONS_FOUND",
          "Applications fetched !",
          false,
          { todays_applications }
        )
      );
  },
  change_online_status: async (req, res) => {
    const { change_to, socket_id, email } = req.body;
    if (!change_to || !socket_id)
      return res
        .status(401)
        .send(
          new CustomResponse(
            "VALIDATION_FAILED",
            "No change or socket provided"
          )
        );
    if (change_to === "online") {
      await ClerkAccount.update({ socket: socket_id }, { where: { email } });
      return res
        .status(201)
        .send(
          new CustomResponse("STATUS_CHANGED", "Status set as online", false)
        );
    } else if (change_to === "offline") {
      await ClerkAccount.update({ socket: null }, { where: { email } });
      return res
        .status(201)
        .send(
          new CustomResponse("STATUS_CHANGED", "Status set as offline", false)
        );
    } else {
      return res
        .status(401)
        .send(new CustomResponse("VALIDATION_FAILED", "Invalid status"));
    }
  },
  get_submitted_data: async (req, res) => {
    const { application } = req.body;
    const citizen_application = await CitizenApplications.findByPk(
      application.application_id
    );
    const citizen = await Aadhar.findByPk(citizen_application.citizen_id);
    citizen.photo = await imageToBase64("aadhar-data/" + citizen.photo);
    const all_data = { citizen_application, citizen };
    switch (citizen_application.form_type) {
      case "BIRTH":
        all_data.form_data = await BirthForm.findByPk(
          citizen_application.form_id
        );
        all_data.form_data.permanentAddProofDOC = await imageToBase64(
          all_data.form_data.permanentAddProofDOC
        );
        all_data.form_data.marriageCertificateDOC = await imageToBase64(
          all_data.form_data.marriageCertificateDOC
        );
        all_data.form_data.proofOfBirthDOC = await imageToBase64(
          all_data.form_data.proofOfBirthDOC
        );
        all_data.mother = await Aadhar.findByPk(
          all_data.form_data.motherAadhar
        );
        all_data.mother.photo = await imageToBase64(
          "aadhar-data/" + all_data.mother.photo
        );
        all_data.father = await Aadhar.findByPk(
          all_data.form_data.fatherAadhar
        );
        all_data.father.photo = await imageToBase64(
          "aadhar-data/" + all_data.father.photo
        );
        break;
      case "MARRIAGE":
        all_data.form_data = await MarriageForm.findByPk(
          citizen_application.form_id
        );
        all_data.form_data.groomSignature = await imageToBase64(
          all_data.form_data.groomSignature
        );
        all_data.form_data.brideSignature = await imageToBase64(
          all_data.form_data.brideSignature
        );
        all_data.form_data.witnessID = await imageToBase64(
          all_data.form_data.witnessID
        );
        all_data.form_data.witnessSignature = await imageToBase64(
          all_data.form_data.witnessSignature
        );
        all_data.form_data.priestSignature = await imageToBase64(
          all_data.form_data.priestSignature
        );
        all_data.form_data.marriagePhoto1 = await imageToBase64(
          all_data.form_data.marriagePhoto1
        );
        all_data.form_data.marriagePhoto2 = await imageToBase64(
          all_data.form_data.marriagePhoto2
        );
        all_data.groom = await Aadhar.findByPk(all_data.form_data.groomAadhar);
        all_data.bride = await Aadhar.findByPk(all_data.form_data.brideAadhar);
        all_data.groom.photo = await imageToBase64(
          "aadhar-data/" + all_data.groom.photo
        );
        all_data.bride.photo = await imageToBase64(
          "aadhar-data/" + all_data.bride.photo
        );
        break;
      case "DEATH":
        all_data.form_data = await DeathForm.findByPk(
          citizen_application.form_id
        );
        all_data.deceased = await Aadhar.findByPk(
          all_data.form_data.deceasedAadhar
        );
        all_data.deceased.photo = await imageToBase64(
          "aadhar-data/" + all_data.deceased.photo
        );
        all_data.filler = await Aadhar.findByPk(
          all_data.form_data.fillerAadhar
        );
        all_data.filler.photo = await imageToBase64(
          "aadhar-data/" + all_data.filler.photo
        );
        all_data.form_data.crematoriumDeclaration = await imageToBase64(
          all_data.form_data.crematoriumDeclaration
        );
        all_data.form_data.hospitalDeclaration = await imageToBase64(
          all_data.form_data.hospitalDeclaration
        );
        break;
      default:
        break;
    }
    res.status(200).send(
      new CustomResponse("DATA_COMBINED", "Data fetched...", false, {
        all_data,
      })
    );
  },
  set_application_joined_online: async (req, res) => {
    const { application, email } = req.body;
    const clerk = await ClerkAccount.findOne({ where: { email } });
    if (!clerk.clerk_id === application.clerk_id) {
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQUEST", "Fake requests are declined"));
    }
    await CitizenApplications.update(
      { joined_online: true },
      { where: { application_id: application.application_id } }
    );
    const citizen = await CitizenAccount.findByPk(application.citizen_id);
    const mailData = mailer.generate_mail(
      citizen.fullName,
      "Online verification done",
      ""
    );
    mailer.send_mail(
      citizen.email,
      "Thanks for joining the online verification. Updates on your application will be reflected in your dashboard.",
      mailData
    );
    res
      .status(200)
      .send(
        new CustomResponse("STATUS_CHANGED", "Set as joined online", false)
      );
  },
  issue_certificate: async (req, res) => {
    const { email, application, form_type } = req.body;
    const types = ["BIRTH", "MARRIAGE", "DEATH"];
    if (!email || !application || !form_type || !types.includes(form_type))
      return res
        .status(401)
        .send(new CustomResponse("INCORRECT_DATA", "Incorrect req data"));
    const clerk = await ClerkAccount.findByPk(application.clerk_id);
    if (!clerk)
      return res
        .status(401)
        .send(new CustomResponse("FAKE_REQ", "Fake requests are declined"));
    let certi_path;
    let mailData;
    switch (form_type) {
      case "BIRTH":
        const birth_form = await BirthForm.findByPk(application.form_id);
        const mother = await Aadhar.findByPk(birth_form.motherAadhar);
        const father = await Aadhar.findByPk(birth_form.fatherAadhar);
        certi_path = `certificates/birth/${
          application.holders[0]
        }_${Date.now()}.pdf`;
        generate_birth_certificate("templates/birth_template.pdf", certi_path, {
          district: application.district,
          name: application.holders[0],
          gender: birth_form.childGender,
          dob: birth_form.childBirthDate,
          placeOfBirth: application.placeOfBirth,
          father: `${father.firstName} ${father.middleName} ${father.lastName}`,
          mother: `${mother.firstName} ${mother.middleName} ${mother.lastName}`,
          addressLine: father.addressLine,
          district: father.district,
          doi: new Date().toDateString(),
        });
        await BirthForm.update(
          { certificate: certi_path },
          { where: { application_id: application.application_id } }
        );
        await CitizenApplications.update(
          { issued: true, rejection_reason: null },
          { where: { application_id: application.application_id } }
        );
        mailData = mailer.generate_mail(
          father.firstName,
          `${application.holders[0].split(" ")[0]}' birth certificate`,
          ""
        );
        mailer.send_mail(
          father.email,
          `Birth certificate for ${
            application.holders[0].split(" ")[0]
          } has been issued. You can get it anytime from the dashboard.`,
          mailData,
          certi_path
        );
        return res
          .status(201)
          .send(
            new CustomResponse(
              "CERTIFICATE_ISSUED",
              "Certificate has been issued",
              false
            )
          );
        break;
      case "MARRIAGE":
        const marriage_form = await MarriageForm.findByPk(application.form_id);
        const groom = await Aadhar.findByPk(marriage_form.groomAadhar);
        const bride = await Aadhar.findByPk(marriage_form.brideAadhar);
        certi_path = `certificates/marriage/${
          application.holders[0]
        }_${Date.now()}.pdf`;
        generate_marriage_certificate(
          "templates/marriage_template.pdf",
          certi_path,
          {
            district: application.district,
            groom: `${groom.firstName} ${groom.middleName} ${groom.lastName}`,
            groomReligion: marriage_form.groomReligion,
            groomDOB: marriage_form.groomDOB,
            bride: `${bride.firstName} ${bride.middleName} ${bride.lastName}`,
            brideReligion: marriage_form.brideReligion,
            brideDOB: marriage_form.brideDOB,
            doi: new Date().toDateString(),
          }
        );
        await MarriageForm.update(
          { certificate: certi_path },
          { where: { application_id: application.application_id } }
        );
        await CitizenApplications.update(
          { issued: true, rejection_reason: null },
          { where: { application_id: application.application_id } }
        );
        mailData = mailer.generate_mail(
          groom.firstName,
          `${application.holders[0].split(" ")[0]}' marriage certificate`,
          ""
        );
        mailer.send_mail(
          groom.email,
          `Marriage certificate for ${
            application.holders[0].split(" ")[0]
          } has been issued. You can get it anytime from the dashboard.`,
          mailData,
          certi_path
        );
        return res
          .status(201)
          .send(
            new CustomResponse(
              "CERTIFICATE_ISSUED",
              "Certificate has been issued",
              false
            )
          );
        break;
      case "DEATH":
        const death_form = await DeathForm.findByPk(application.form_id);
        certi_path = `certificates/death/${
          application.holders[0]
        }_${Date.now()}.pdf`;
        const deceased = await Aadhar.findByPk(death_form.deceasedAadhar);
        const filler = await Aadhar.findByPk(death_form.fillerAadhar);
        generate_death_certificate("templates/death_template.pdf", certi_path, {
          district: application.district,
          name: application.holders[0],
          reason: death_form.deathReason,
          dob: deceased.DOB,
          dod: death_form.dateOfDeath,
          doi: new Date().toDateString(),
        });
        await DeathForm.update(
          { certificate: certi_path },
          { where: { application_id: application.application_id } }
        );
        await CitizenApplications.update(
          { issued: true, rejection_reason: null },
          { where: { application_id: application.application_id } }
        );
        mailData = mailer.generate_mail(
          filler.firstName,
          `${application.holders[0].split(" ")[0]}' death certificate`,
          ""
        );
        mailer.send_mail(
          filler.email,
          `Death certificate for ${
            application.holders[0].split(" ")[0]
          } has been issued. You can get it anytime from the dashboard.`,
          mailData,
          certi_path
        );
        return res
          .status(201)
          .send(
            new CustomResponse(
              "CERTIFICATE_ISSUED",
              "Certificate has been issued",
              false
            )
          );
        break;
      default:
        break;
    }
  },
  reject_application: async (req, res) => {
    const { email, application, form_type, reason } = req.body;
    const types = ["BIRTH", "MARRIAGE", "DEATH"];
    if (
      !email ||
      !application ||
      !form_type ||
      !reason ||
      !types.includes(form_type)
    )
      return res
        .status(401)
        .send(new CustomResponse("INCORRECT_DATA", "Incorrect req data"));
    await CitizenApplications.update(
      { issued: false, rejection_reason: reason },
      { where: { application_id: application.application_id } }
    );
    const citizen = await CitizenAccount.findByPk(application.citizen_id);
    mailData = mailer.generate_mail(
      citizen.firstName,
      `${application.holders[0].split(" ")[0]}' ${
        application.form_type
      } certificate`,
      ""
    );
    mailer.send_mail(
      filler.email,
      `Application for ${
        application.holders[0].split(" ")[0]
      }'s certificate has been rejected. You can view more details on the dashboard.`,
      mailData
    );
    return res
      .status(201)
      .send(
        new CustomResponse("REJECTED", "Application has been rejected !", false)
      );
  },
};
module.exports = clerk_controller;
