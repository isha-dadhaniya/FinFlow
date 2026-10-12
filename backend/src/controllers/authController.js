const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signup = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\-_!#$%^&*(),.?":{}|<>])/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase, digit, and special character (@, -, _, etc.)"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      mobile,
      password: hashedPassword,
    });

    // Generate JWT token on signup so user is logged in immediately
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        selectedModes: user.selectedModes,
        defaultMode: user.defaultMode,
        accountType: user.accountType,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        selectedModes: user.selectedModes,
        defaultMode: user.defaultMode,
        accountType: user.accountType,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateSelectedModes = async (req, res) => {
  try {
    const { selectedModes, defaultMode } = req.body;

    const validModes = ["personal", "family", "business"];

    if (!Array.isArray(selectedModes) || selectedModes.length === 0) {
      return res.status(400).json({ message: "At least one mode must be selected" });
    }

    const allValid = selectedModes.every((mode) => validModes.includes(mode));
    if (!allValid) {
      return res.status(400).json({ message: "Invalid mode in selection" });
    }

    // Default mode must be one of the selected modes
    const resolvedDefault = defaultMode && selectedModes.includes(defaultMode)
      ? defaultMode
      : selectedModes[0];

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        selectedModes,
        defaultMode: resolvedDefault,
        // Keep accountType in sync for backward compatibility
        accountType: resolvedDefault,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Selected modes updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        selectedModes: user.selectedModes,
        defaultMode: user.defaultMode,
        accountType: user.accountType,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Legacy endpoint — kept for backward compatibility
const updateAccountType = async (req, res) => {
  try {
    const { accountType } = req.body;

    if (!["personal", "family", "business"].includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        accountType,
        selectedModes: [accountType],
        defaultMode: accountType,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Account type updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        selectedModes: user.selectedModes,
        defaultMode: user.defaultMode,
        accountType: user.accountType,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    const userEmail = email || "isha.google@gmail.com";
    const userName = fullName || "Isha Dadhaniya (Google)";

    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const hashedPassword = await bcrypt.hash("google_auth_sec_key", 10);
      user = await User.create({
        fullName: userName,
        email: userEmail,
        password: hashedPassword,
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Google sign-in successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        selectedModes: user.selectedModes,
        defaultMode: user.defaultMode,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login, updateSelectedModes, updateAccountType, googleAuth };
