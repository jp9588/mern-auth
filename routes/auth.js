const express = require('express');
const { authRegister, authLogin, authforgotPassword, authResetPassword } = require('../controllers/authControllers');

const router = express.Router();

router.post('/register', authRegister);

router.post('/login', authLogin);

router.post('/forgotpassword', authforgotPassword);

router.put('/resetpassword/:resetToken', authResetPassword);

module.exports = router;
