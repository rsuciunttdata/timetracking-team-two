function isValidDate(dateString) {
  if (!dateString) return false;

  const selectedDate = new Date(dateString);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  return selectedDate <= today && !isNaN(selectedDate.getTime());
}

function isValidTimeFormat(timeString) {
  if (!timeString) return false;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

function isValidBreakFormat(breakTime) {
  if (!breakTime || breakTime.trim() === '') {
    return true;
  }

  const trimmed = breakTime.trim();
  const fullFormatRegex = /^(\d+)h\s+(\d+)m$/;
  const hoursOnlyRegex = /^(\d+)h$/;
  const minutesOnlyRegex = /^(\d+)m$/;

  let hours = 0;
  let minutes = 0;

  if (fullFormatRegex.test(trimmed)) {
    const match = trimmed.match(fullFormatRegex);
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
  } else if (hoursOnlyRegex.test(trimmed)) {
    const match = trimmed.match(hoursOnlyRegex);
    hours = parseInt(match[1]);
  } else if (minutesOnlyRegex.test(trimmed)) {
    const match = trimmed.match(minutesOnlyRegex);
    minutes = parseInt(match[1]);
  } else {
    return false;
  }

  return hours >= 0 && hours <= 8 && minutes >= 0 && minutes <= 59;
}

function parseBreakTime(breakTime) {
  if (!breakTime || breakTime.trim() === '') {
    return 0;
  }

  const trimmed = breakTime.trim();
  const fullFormatRegex = /^(\d+)h\s+(\d+)m$/;
  const hoursOnlyRegex = /^(\d+)h$/;
  const minutesOnlyRegex = /^(\d+)m$/;

  let hours = 0, minutes = 0;

  if (fullFormatRegex.test(trimmed)) {
    const match = trimmed.match(fullFormatRegex);
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
  } else if (hoursOnlyRegex.test(trimmed)) {
    const match = trimmed.match(hoursOnlyRegex);
    hours = parseInt(match[1]);
  } else if (minutesOnlyRegex.test(trimmed)) {
    const match = trimmed.match(minutesOnlyRegex);
    minutes = parseInt(match[1]);
  }

  return hours * 60 + minutes;
}

function isBreakTimeLessThanWorkedTime(startTime, endTime, breakTime) {
  if (!startTime || !endTime) return true;
  if (!breakTime || breakTime.trim() === '') return true;

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const totalWorkedMinutes = endTotalMinutes - startTotalMinutes;

  const breakMinutes = parseBreakTime(breakTime);
  return breakMinutes < totalWorkedMinutes;
}

function calculateTotal(startTime, endTime, breakTime) {
  if (!startTime || !endTime) return '0h 0m';

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  totalMinutes -= parseBreakTime(breakTime || '');

  totalMinutes = Math.max(totalMinutes, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function validateTimeEntry(entryData, isUpdate = false) {
  const errors = [];
  const { date, startTime, endTime, breakTime } = entryData;

  if (!date) {
    errors.push('Date is required');
  }

  if (!startTime) {
    errors.push('Start time is required');
  }

  if (date && !isValidDate(date)) {
    errors.push('Date cannot be in the future. Please select today or a past date.');
  }

  if (startTime && !isValidTimeFormat(startTime)) {
    errors.push('Start time must be in HH:MM format');
  }

  if (endTime && !isValidTimeFormat(endTime)) {
    errors.push('End time must be in HH:MM format');
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push('End time must be after start time');
  }

  if (breakTime && !isValidBreakFormat(breakTime)) {
    errors.push('Break format must be like "1h 30m", "2h", or "45m" (hours: 0-8, minutes: 0-59)');
  }

  if (startTime && endTime && breakTime && !isBreakTimeLessThanWorkedTime(startTime, endTime, breakTime)) {
    errors.push('Break duration cannot be equal to or greater than the total worked time');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function sanitizeEntryData(entryData) {
  const sanitized = {
    date: entryData.date || '',
    project: entryData.project || '',
    startTime: entryData.startTime || '',
    endTime: entryData.endTime || '',
    break: entryData.break || entryData.breakTime || '',
    status: entryData.status || 'draft',
    description: entryData.description || '',
    rejectionMessage: entryData.rejectionMessage || ''
  };

  if (sanitized.startTime && sanitized.endTime) {
    sanitized.total = calculateTotal(sanitized.startTime, sanitized.endTime, sanitized.break);
  } else {
    sanitized.total = '0h 0m';
  }

  return sanitized;
}

module.exports = {
  validateTimeEntry,
  sanitizeEntryData,
  isValidDate,
  isValidTimeFormat,
  isValidBreakFormat,
  parseBreakTime,
  isBreakTimeLessThanWorkedTime,
  calculateTotal
};
