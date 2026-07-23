function uniquePatient() {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    firstName: `E2E${stamp.slice(-6)}`,
    lastName: 'Patient',
    gender: 'Female',
    dateOfBirth: '1991-04-12',
    phone: `+1555${String(Date.now()).slice(-7)}`,
    email: `e2e.${stamp}@example.com`,
    bloodGroup: 'O+',
    status: 'Stable',
    address: '100 Test Lane',
  };
}

function futureAppointmentSlot() {
  const date = new Date();
  // Spread across days/times so parallel browser projects never 409 on shared DB
  date.setUTCDate(date.getUTCDate() + 14 + Math.floor(Math.random() * 40));
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hour = 14 + Math.floor(Math.random() * 5);
  const minute = Math.floor(Math.random() * 12) * 5;
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    department: 'Internal Medicine',
  };
}

async function readStat(page, label) {
  const card = page.locator('.card').filter({ hasText: label }).first();
  await card.waitFor();
  const valueText = await card.locator('.stat-value').first().innerText();
  return Number(valueText.trim());
}

module.exports = {
  uniquePatient,
  futureAppointmentSlot,
  readStat,
};
