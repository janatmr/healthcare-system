const {
  getPagination,
  buildPaginationMeta,
} = require('../../utils/pagination');

describe('getPagination', () => {
  test('applies defaults', () => {
    expect(getPagination({})).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
      sort: '-createdAt',
    });
  });

  test('clamps page and limit', () => {
    expect(getPagination({ page: '0', limit: '500' })).toMatchObject({
      page: 1,
      limit: 100,
      skip: 0,
    });
  });

  test('computes skip from page and limit', () => {
    expect(getPagination({ page: '3', limit: '5', sort: 'lastName' })).toEqual({
      page: 3,
      limit: 5,
      skip: 10,
      sort: 'lastName',
    });
  });
});

describe('buildPaginationMeta', () => {
  test('returns zero pages when total is zero', () => {
    expect(buildPaginationMeta(1, 10, 0)).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    });
  });

  test('ceils pages', () => {
    expect(buildPaginationMeta(2, 10, 25)).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      pages: 3,
    });
  });
});
