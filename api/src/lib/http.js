export function sendOk(response, data) {
  return response.json({
    ok: true,
    data
  });
}

export function sendError(response, status, message, details) {
  return response.status(status).json({
    ok: false,
    error: {
      message,
      details: details || null
    }
  });
}

export function asyncHandler(handler) {
  return async function wrappedHandler(request, response, next) {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}
