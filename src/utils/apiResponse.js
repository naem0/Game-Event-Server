/**
 * Standard success response
 */
export const successResponse = (res, statusCode = 200, message = "Success", data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  })
}

/**
 * Standard error response
 */
export const errorResponse = (res, statusCode = 500, message = "Server error", errors = null) => {
  const response = {
    success: false,
    message,
  }

  if (errors) {
    response.errors = errors
  }

  return res.status(statusCode).json(response)
}
