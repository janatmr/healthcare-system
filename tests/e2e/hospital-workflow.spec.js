const { test, expect } = require('@playwright/test');
const { loginAs, mainNav } = require('./helpers/auth');
const {
  uniquePatient,
  futureAppointmentSlot,
  readStat,
} = require('./helpers/data');

test.describe.configure({ mode: 'serial' });

test.describe('hospital clinical workflow', () => {
  test('register patient → dashboard → appointment → record → statistics', async ({
    page,
  }) => {
    const patient = uniquePatient();
    const slot = futureAppointmentSlot();
    const diagnosis = `E2E hypertension ${patient.firstName}`;

    await loginAs(page, 'doctor');

    await expect(page.getByText('Total patients')).toBeVisible();
    const patientsBefore = await readStat(page, 'Total patients');
    const recordsBefore = await readStat(page, 'Medical records');
    const upcomingBefore = await readStat(page, 'Upcoming appointments');

    // 1–2. Register patient and verify list/search
    await mainNav(page).getByRole('link', { name: 'Patients', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
    await page.getByRole('button', { name: 'Add patient' }).click();

    const dialog = page.getByRole('dialog', { name: 'Add patient' });
    await dialog.getByLabel('First name').fill(patient.firstName);
    await dialog.getByLabel('Last name').fill(patient.lastName);
    await dialog.getByLabel('Gender').selectOption(patient.gender);
    await dialog.getByLabel('Date of birth').fill(patient.dateOfBirth);
    await dialog.getByLabel('Phone').fill(patient.phone);
    await dialog.getByLabel('Email').fill(patient.email);
    await dialog.getByLabel('Blood group').selectOption(patient.bloodGroup);
    await dialog.getByLabel('Status').selectOption(patient.status);
    await dialog.getByLabel('Address').fill(patient.address);
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(dialog).toBeHidden();
    await page
      .getByRole('searchbox', { name: /search name, phone, or email/i })
      .fill(patient.firstName);
    await expect(
      page.getByRole('cell', { name: `${patient.firstName} ${patient.lastName}` })
    ).toBeVisible();

    // 3. Dashboard patient count increments
    await mainNav(page).getByRole('link', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect
      .poll(async () => readStat(page, 'Total patients'))
      .toBe(patientsBefore + 1);

    // 4. Book appointment and verify schedule
    await mainNav(page).getByRole('link', { name: 'Appointments', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();
    await page.getByRole('button', { name: 'Book appointment' }).click();

    const apptDialog = page.getByRole('dialog', { name: 'Book appointment' });
    await apptDialog
      .getByLabel('Patient')
      .selectOption({ label: `${patient.firstName} ${patient.lastName}` });
    await apptDialog.getByLabel('Date').fill(slot.date);
    await apptDialog.getByLabel('Time').fill(slot.time);
    await apptDialog.getByLabel('Department').fill(slot.department);
    await apptDialog.getByRole('button', { name: 'Save' }).click();
    await expect(apptDialog).toBeHidden();

    await page.getByLabel('Filter by date').fill(slot.date);
    await expect(page.getByRole('cell', { name: slot.time })).toBeVisible();
    await expect(
      page.getByRole('cell', { name: `${patient.firstName} ${patient.lastName}` })
    ).toBeVisible();
    await expect(page.getByText('Saving…')).toHaveCount(0);

    // 5. Create medical record
    await mainNav(page).getByRole('link', { name: 'Records', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Medical Records' })).toBeVisible();
    await page.getByRole('button', { name: 'Add record' }).click();

    const recordDialog = page.getByRole('dialog', { name: 'Add record' });
    await recordDialog
      .getByLabel('Patient')
      .selectOption({ label: `${patient.firstName} ${patient.lastName}` });
    await recordDialog.getByLabel('Diagnosis').fill(diagnosis);
    await recordDialog.getByLabel('Visit date').fill(slot.date);
    await recordDialog.getByLabel('Medication (comma-separated)').fill('Aspirin');
    await recordDialog.getByLabel('Doctor notes').fill('E2E follow-up recommended');
    await recordDialog.getByRole('button', { name: 'Save' }).click();
    await expect(recordDialog).toBeHidden();
    await expect(page.getByRole('cell', { name: diagnosis })).toBeVisible();

    // 6. Final dashboard statistics
    await mainNav(page).getByRole('link', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect
      .poll(async () => readStat(page, 'Total patients'))
      .toBe(patientsBefore + 1);
    await expect
      .poll(async () => readStat(page, 'Medical records'))
      .toBe(recordsBefore + 1);
    await expect
      .poll(async () => readStat(page, 'Upcoming appointments'))
      .toBeGreaterThanOrEqual(upcomingBefore + 1);
    await expect(page.getByText(diagnosis)).toBeVisible();
    await expect(page.getByText(patient.firstName)).toBeVisible();
  });
});
