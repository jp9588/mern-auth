const jwt = require('jsonwebtoken');

const User = require('../models/User');

const protect = async (req, res, next) => {
	let token;

	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}
	if (!token) {
		next(res.status(401).json({ success: false, error: 'Not authorized to this route!' }));
	}

	try {
		const decode = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decode.id);

		if (!user) {
			next(res.status(404).json({ success: false, error: 'User found whit this id' }));
		}

		req.user = user;

		next();
	} catch (error) {
		res.status(401).json({ success: false, error: error.message });
	}
};

module.exports = { protect };
