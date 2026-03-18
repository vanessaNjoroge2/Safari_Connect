import { createSacco, getMySacco } from "./sacco.service.js";

export const addSacco = async (req, res, next) => {
  try {
    const sacco = await createSacco(req.user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Sacco created successfully",
      data: sacco,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchMySacco = async (req, res, next) => {
  try {
    const sacco = await getMySacco(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Sacco fetched successfully",
      data: sacco,
    });
  } catch (error) {
    next(error);
  }
};