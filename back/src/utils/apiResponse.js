function success(res, data = null, statusCode = 200) {
  const response = { success: true };
  if (data !== null) {
    if (data.data && data.meta) {
      response.data = data.data;
      response.meta = data.meta;
    } else {
      response.data = data;
    }
  }
  return res.status(statusCode).json(response);
}

function created(res, data) {
  return success(res, data, 201);
}

function noContent(res) {
  return res.status(204).end();
}

function paginated(res, { data, total, page, limit }) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { success, created, noContent, paginated };
