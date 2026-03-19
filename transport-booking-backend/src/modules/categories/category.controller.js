import { getCategories, createCategory, updateCategory, deleteCategory } from "./category.service.js";

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

export const editCategory = async (req, res, next) => {
  try {
    const category = await updateCategory(req.params.categoryId, req.body);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    const category = await deleteCategory(req.params.categoryId);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};