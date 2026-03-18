import { createRoute, getRoutes } from "./route.service.js";

export const addRoute = async (req, res, next) => {
  try {
    const route = await createRoute(req.body);

    return res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchRoutes = async (req, res, next) => {
  try {
    const routes = await getRoutes();

    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully",
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};