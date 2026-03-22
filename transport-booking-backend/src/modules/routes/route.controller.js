import { createRoute, getRoutes, updateRoute, deleteRoute } from "./route.service.js";

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

export const updateRouteHandler = async (req, res, next) => {
  try {
    const route = await updateRoute(req.params.routeId, req.body);

    return res.status(200).json({
      success: true,
      message: "Route updated successfully",
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRouteHandler = async (req, res, next) => {
  try {
    const result = await deleteRoute(req.params.routeId);

    return res.status(200).json({
      success: true,
      message: "Route deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};