const asyncHandler = async (asyncReq) => {
  return (req, res, next) => {
    Promise.resolve(asyncReq(req, res, next)).catch((error) => {
      next(error);
    });
  };
};

export { asyncHandler };
