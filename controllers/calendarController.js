const Calendar = require('../models/Calendar');
const crud = require('./crudFactory');

module.exports = crud({
  Model: Calendar,
  fields: ['date', 'title', 'status'],
  filters: ['status'],
  sort: { date: 1 },
  dateField: 'date',
});
