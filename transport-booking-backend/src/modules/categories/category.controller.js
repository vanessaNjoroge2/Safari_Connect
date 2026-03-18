import { getCategories, createCategory } from "./category.service.js";

export const fetchCategories = async (req, res, next) => {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const addCategory = async (req, res, next) => {
  try {
    const category = await createCategory(req.body);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};