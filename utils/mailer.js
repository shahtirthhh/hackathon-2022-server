require("dotenv/config");
const Nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const path = require("path");

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "A Hackathon-2022 Project",
    link: "https://hackathon-2022-project.netlify.app/",
  },
});

// Configure the email transporter (using Gmail as an example)
const transporter = Nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_KEY,
  },
});

const generate_mail = (name, title, message) => {
  const email = {
    body: {
      name,
      intro: title,
      action: {
        instructions: message,
        button: {
          text: "",
          link: "",
        },
      },
      outro: "Need help? Reply to this email.",
      signature: "Best regards",
      salutation: "Hackathon-2022 Project team",
    },
  };

  const emailBody = mailGenerator.generate(email);
  const emailText = mailGenerator.generatePlaintext(email);

  return { emailText, emailBody };
};

const send_mail = (to, subject, emailData, filePath) => {
  if (filePath) {
    transporter.sendMail(
      {
        from: "shahtirth.application.testing@gmail.com",
        to,
        subject,
        html: emailData.emailBody,
        text: emailData.emailText,
        attachments: [
          {
            filename: path.basename(filePath),
            path: filePath,
          },
        ],
      },
      (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log(`Email sent: ${to}`);
      }
    );
  } else
    transporter.sendMail(
      {
        from: "shahtirth.application.testing@gmail.com",
        to,
        subject,
        html: emailData.emailBody,
        text: emailData.emailText,
      },
      (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log(`Email sent: ${to}`);
      }
    );
};
module.exports = { send_mail, generate_mail };
