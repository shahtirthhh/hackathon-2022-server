const only_digits = /^[0-9]+$/;
const only_alpha = /^[A-Za-z]+$/;
const isMobile = /^\d{10}$/;
const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validators = {
  aadhar_validator: (aadhar_number) => {
    if (
      !aadhar_number ||
      aadhar_number.length !== 12 ||
      !only_digits.test(aadhar_number)
    )
      return false;
    else return true;
  },

  only_alpha_validator: (data) => {
    if (!data || !only_alpha.test(data)) return false;
    else return true;
  },
  mobile_number_validator: (mobile) => {
    if (!mobile || !isMobile.test(mobile)) return false;
    else return true;
  },
  email_validator: (email) => {
    if (!email || !isEmail.test(email)) return false;
    else return true;
  },
  password_validator: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (
      password.length < minLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumber ||
      !hasSpecialChar
    ) {
      return false;
    }

    return true;
  },
  image_validator: (originalname, size) => {
    const allowedFileTypes = ["jpeg", "png", "jpg"];
    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (!originalname || !size) {
      return false;
    }
    if (!allowedFileTypes.includes(originalname.split(".")[1])) {
      return false;
    }

    if (size > maxFileSize) {
      return false;
    }
    return true;
  },
};
module.exports = validators;
