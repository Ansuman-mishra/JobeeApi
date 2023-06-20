const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/users");

// Get current user profile => /api/v1/me

exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});
