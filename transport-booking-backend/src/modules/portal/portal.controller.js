import { getPortalHelpArticles, getPortalNotifications } from "./portal.service.js";

export const fetchPortalNotifications = async (req, res, next) => {
  try {
    const data = await getPortalNotifications(req.user, req.query || {});
    return res.status(200).json({
      success: true,
      message: "Portal notifications fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchPortalHelpArticles = async (req, res, next) => {
  try {
    const data = await getPortalHelpArticles(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Portal help articles fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
