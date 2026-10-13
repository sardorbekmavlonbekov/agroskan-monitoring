const Archive = require('../models/Archive');
const crud = require('./crudFactory');

module.exports = crud({
  Model: Archive,
  fields: ['year', 'crop', 'yield', 'notes'],
  filters: ['year', 'crop'],
  sort: { year: -1, createdAt: -1 },
});
