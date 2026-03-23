import { aiAssistSchema, aiChatSchema, aiVoiceSchema } from "./ai.validation.js";
import { getAiAssist, getAiChat, getAiContext, getAiHealth, getAiVoice } from "./ai.service.js";

export const health = async (req, res, next) => {
  try {
    const data = await getAiHealth();
    return res.status(200).json({
      success: true,
      message: "AI agent health fetched successfully",
      data
    });
  } catch (error) {
    return next(error);
  }
};

export const context = async (req, res, next) => {
  try {
    const data = await getAiContext(req.user);
    return res.status(200).json({
      success: true,
      message: "AI context fetched successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const assist = async (req, res, next) => {
  try {
    const payload = aiAssistSchema.parse(req.body || {});
    const data = await getAiAssist(payload);

    return res.status(200).json({
      success: true,
      message: "AI decision assist completed",
      data
    });
  } catch (error) {
    return next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const payload = aiChatSchema.parse(req.body || {});
    const chatContext = await getAiContext(req.user);
    const data = await getAiChat({
      ...payload,
      role: req.user?.role,
      context: chatContext,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat response generated",
      data
    });
  } catch (error) {
    return next(error);
  }
};

export const voice = async (req, res, next) => {
  try {
    const payload = aiVoiceSchema.parse(req.body || {});
    const data = await getAiVoice(payload);

    return res.status(200).json({
      success: true,
      message: "AI voice response generated",
      data
    });
  } catch (error) {
    return next(error);
  }
};
