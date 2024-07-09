require("dotenv/config");
const fs = require("fs");

const VALIDATORS = require("../../utils/validators");
const country_data = require("../../data/data");
const mailer = require("../../utils/mailer");

const Aadhar = require("../../models/aadhar_model");
const OtpService = require("../../models/otp_service_model");
const sequelize = require("../../database");

class CustomResponse {
  constructor(code, message, isError = true, data = undefined) {
    this.code = code;
    this.message = message;
    this.error = isError;
    this.data = data;
  }
}

const delete_saved_file = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Failed to delete file:", filePath, err);
  });
};

const otp_generator = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const aadhar_controller = {
  generate_aadhar_otp: async (req, res) => {
    const { aadhar } = req.body;
    if (!VALIDATORS.aadhar_validator(aadhar))
      res
        .status(400)
        .send(new CustomResponse("INVALID_AADHAR", "Invalid aadhar number"));
    else {
      const found_aadhar = await Aadhar.findByPk(aadhar);
      if (!found_aadhar)
        res
          .status(404)
          .send(new CustomResponse("NO_AADHAR_FOUND", "No aadhar found"));
      else {
        const send_otp = async () => {
          const otp = otp_generator();
          await OtpService.create({
            otp,
            aadhar,
            createdAt: new Date().toString(),
          });
          const mailData = mailer.generate_mail(
            found_aadhar.firstName,
            "One time password for aadhar usage in Hackathon-2022 project",
            `Your OTP is ${otp}. Please do not share it and report if you have not generated it !`
          );
          mailer.send_mail(
            found_aadhar.email,
            "OTP for Aadhar usage",
            mailData
          );

          res
            .status(201)
            .send(
              new CustomResponse(
                "OTP_GENERATED",
                `OTP sent to ${found_aadhar.email}`,
                false
              )
            );
        };

        const old_otp_data = await OtpService.findOne({ where: { aadhar } });
        if (old_otp_data) {
          const otp_time = new Date(old_otp_data.createdAt);
          const current_time = new Date();
          if (Math.abs(current_time - otp_time) >= 60000) {
            await OtpService.destroy({ where: { aadhar: found_aadhar.id } });
            send_otp();
          } else {
            res
              .status(400)
              .send(
                new CustomResponse(
                  "LIMIT_EXCEEDED",
                  "Wait for 1min before requesting another OTP",
                  true
                )
              );
          }
        } else send_otp();
      }
    }
  },
  verify_aadhar_otp: async (req, res) => {
    const { aadhar, otp } = req.body;
    if (!VALIDATORS.aadhar_validator(aadhar) || !/^\d{4}$/.test(otp))
      res
        .status(400)
        .send(new CustomResponse("INVALID_DATA", "Invalid data provided"));
    else {
      const otp_data = await OtpService.findOne({ where: { aadhar: aadhar } });
      if (!otp_data)
        res
          .status(404)
          .send(new CustomResponse("NO_DATA_FOUND", "Incorrect data found !"));
      else {
        if (otp_data.otp === otp) {
          await OtpService.destroy({ where: { aadhar: aadhar } });
          const fullName = await Aadhar.findOne({
            where: { id: aadhar },
            attributes: [
              [
                sequelize.fn(
                  "concat",
                  sequelize.col("firstName"),
                  " ",
                  sequelize.col("middleName"),
                  " ",
                  sequelize.col("lastName")
                ),
                "fullName",
              ],
            ],
          });
          res
            .status(200)
            .send(
              new CustomResponse(
                "OTP_VALIDATION_SUCESS",
                "Aadhar user verified",
                false,
                { fullName }
              )
            );
        } else {
          res
            .status(400)
            .send(
              new CustomResponse("OTP_VALIDATION_FAILED", "Incorrect OTP !")
            );
        }
      }
    }
  },

  add_new_aadhar: async (req, res) => {
    try {
      const {
        secretKey,
        aadharNumber,
        firstName,
        middleName,
        lastName,
        gender,
        dob,
        addressLine,
        district,
        state,
        mobile,
        email,
      } = req.body;

      const { path: filePath, filename } = req.file;
      const found_aadhar = await Aadhar.findByPk(aadharNumber);
      if (found_aadhar) {
        delete_saved_file(filePath);
        return res
          .status(400)
          .send(
            new CustomResponse(
              "AADHAR_ALREADY_EXISTS",
              "Provided aadhar number already exists !"
            )
          );
      }
      {
        // Validate secret key
        if (!secretKey || secretKey !== process.env.AADHAR_OP_KEY) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(
              new CustomResponse("VALIDATION_ERROR", "Invalid secret key !")
            );
        }

        // Validate Aadhar Number
        if (!VALIDATORS.aadhar_validator(aadharNumber)) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(
              new CustomResponse("VALIDATION_ERROR", "Invalid aadhar number")
            );
        }

        // Validate Name Fields
        if (
          !VALIDATORS.only_alpha_validator(firstName) ||
          !VALIDATORS.only_alpha_validator(middleName) ||
          !VALIDATORS.only_alpha_validator(lastName)
        ) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(
              new CustomResponse("VALIDATION_ERROR", "Invalid name fields")
            );
        }

        // Validate Gender
        if (!["male", "female", "others"].includes(gender.toLowerCase())) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(new CustomResponse("VALIDATION_ERROR", "Invalid gender"));
        }

        // Validate Date of Birth (Assuming dob is already in valid format 'yyyy-mm-dd')
        if (isNaN(new Date(dob))) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(new CustomResponse("VALIDATION_ERROR", "Invalid date"));
        }
        if (!addressLine || addressLine.trim().length <= 5) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(new CustomResponse("VALIDATION_ERROR", "Invalid address"));
        }
        if (!country_data.Gujarat.includes(district)) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(new CustomResponse("VALIDATION_ERROR", "Invalid state"));
        }
        if (!Object.keys(country_data).includes(state)) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(new CustomResponse("VALIDATION_ERROR", "Invalid district"));
        }
        // Validate Mobile Number
        if (!VALIDATORS.mobile_number_validator(mobile)) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(
              new CustomResponse("VALIDATION_ERROR", "Invalid mobile number")
            );
        }

        // Validate Email
        if (!VALIDATORS.email_validator(email)) {
          delete_saved_file(filePath);
          return res
            .status(400)
            .send(
              new CustomResponse("VALIDATION_ERROR", "Invalid email number")
            );
        }
      }
      // Create Aadhar object
      await Aadhar.create({
        id: aadharNumber,
        photo: filename, // Assuming you store filename in the Aadhar model for photo
        firstName,
        middleName,
        lastName,
        gender,
        DOB: new Date(dob).toDateString(), // Convert date to string as per your requirement
        addressLine,
        district,
        state,
        mobile,
        email,
      });

      res
        .status(201)
        .send(new CustomResponse("AADHAR_CREATED", "Aadhar created !", false));
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send(
          new CustomResponse("UNEXPECTED_ERROR", "An unexpected error occured")
        );
    }
  },
};

module.exports = aadhar_controller;
