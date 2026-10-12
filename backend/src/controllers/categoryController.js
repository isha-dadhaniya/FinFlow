const Category = require("../models/Category");

const defaultCategories = [
  { name: "Housing & Rent", type: "expense", icon: "Home", color: "#005B4F", isDefault: true },
  { name: "Groceries & Dining", type: "expense", icon: "ShoppingCart", color: "#2B3138", isDefault: true },
  { name: "Business Revenue", type: "income", icon: "TrendingUp", color: "#005B4F", isDefault: true },
  { name: "Salary & Wages", type: "income", icon: "DollarSign", color: "#D4AF37", isDefault: true },
  { name: "Utilities & Bills", type: "expense", icon: "Zap", color: "#008573", isDefault: true },
  { name: "Travel & Transport", type: "expense", icon: "Car", color: "#2A9D8F", isDefault: true },
  { name: "Entertainment", type: "expense", icon: "Film", color: "#D4AF37", isDefault: true },
];

const getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ userId: req.user.id }).sort({ name: 1 });

    if (categories.length === 0) {
      // Seed default categories for new user
      const seeded = defaultCategories.map((c) => ({
        ...c,
        userId: req.user.id,
      }));
      categories = await Category.insertMany(seeded);
    }

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    const category = await Category.create({
      userId: req.user.id,
      name,
      type: type || "expense",
      icon: icon || "Tag",
      color: color || "#005B4F",
      isDefault: false,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
