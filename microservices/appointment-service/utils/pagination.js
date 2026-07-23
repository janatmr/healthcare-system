function getPagination(query = {}, defaultSort = '-appointmentDate') {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || 10;
  if (Number.isNaN(limit) || limit < 1) {
    limit = 10;
  }
  limit = Math.min(limit, 100);

  const skip = (page - 1) * limit;
  const sort =
    typeof query.sort === 'string' && query.sort.trim()
      ? query.sort.trim()
      : defaultSort;

  return { page, limit, skip, sort };
}

function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = {
  getPagination,
  buildPaginationMeta,
};
