const userModel = require('../models/User');
const sendMail = require('../utils/sendMailer');
const crypto = require('crypto');

const authLogin = async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		res.status(400).json({ success: false, error: 'Please provide email & password' });
	}
	try {
		const user = await userModel.findOne({ email }).select('+password');
		if (!user) {
			res.status(404).json({ success: false, error: 'Invalid credencials' });
		}
		const isMatch = await user.matchPassword(password);

		if (!isMatch) {
			res.status(404).json({ success: false, error: 'Invalid credencials' });
		}
		//res.status(200).json({ success: true, token: 'hdju80kdi' });
		sendToken(user, 200, res);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const authRegister = async (req, res, next) => {
	const { username, email, password } = req.body;
	try {
		const user = await userModel.create({ username, email, password });

		// res.status(201).json({
		// 	success: true,
		// 	user
		// });
		sendToken(user, 201, res);
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message
		});
		next();
	}
};

const authforgotPassword = async (req, res, next) => {
	const { email } = req.body;

	try {
		const user = await userModel.findOne({ email });
		if (!user) {
			next(res.status(404).json({ success: false, message: 'Email not sent' }));
		}

		const resetToken = user.getResetPasswordToken();

		await user.save();
		const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;
		const message = `
			<h1>You have requested a password reset</h1>
			<p>Please go to this link to reset your password</p>
			<a href=${resetUrl} clicktracking=off>${resetUrl}</a>
		`;
		try {
			await sendMail({
				to: user.email,
				subject: 'Password Reset Request',
				text: message
			});
			res.status(200).json({ success: true, data: 'Email has been sent' });
		} catch (error) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;

			await user.save();

			return next(res.status(500).json({ success: false, data: 'Email could not be sent' }));
		}
	} catch (error) {
		next(res.status(404).json({ success: false, message: error }));
	}
};

const authResetPassword = async (req, res, next) => {
	//recuperar el token de reset de los parametros y crear con el el
	//hash para buscarlo en la base de datos
	const resetToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
	//console.log(resetPasswordToken);

	try {
		const user = await userModel.findOne({
			resetPasswordToken: resetToken,
			resetPasswordExpire: { $gt: Date.now() }
		});
		//validar si el usuario existe en la base si no enviar el codigo del
		//error
		if (!user) {
			return next(res.status(400).json({ success: false, data: 'Invalid reset token' }));
		}
		//resetear la informacion del pss el token y el token expire
		user.password = req.body.password;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;
		//guardar el nuevo estado en la base de datos
		await user.save();
		res.status(201).json({ success: true, data: 'PAssword Reset Success' });
	} catch (error) {
		next(error);
	}
};

const sendToken = (user, statusCode, res) => {
	const token = user.getSignedToken();

	return res.status(statusCode).json({ success: true, token: token });
};

module.exports = {
	authLogin,
	authRegister,
	authResetPassword,
	authforgotPassword
};
