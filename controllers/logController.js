const Log = require('../models/Log');
const crud = require('./crudFactory');

module.exports = crud({
  Model: Log,
  fields: ['date', 'field', 'action', 'note'],
  filters: ['field', 'action'],
  sort: { date: -1 },
  dateField: 'date',
});
