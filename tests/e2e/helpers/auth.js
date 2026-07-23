const CREDENTIALS = {
  admin: {
    email: 'admin@hospital.local',
    password: 'Password123!',
  },
  doctor: {
    email: 'doctor1@hospital.local',
    password: 'Password123!',
  },
  nurse: {
    email: 'nurse1@hospital.local',
    password: 'Password123!',
  },
};

async function loginAs(page, role = 'doctor') {
  const creds = CREDENTIALS[role];
  if (!creds) {
    throw new Error(`Unknown role: ${role}`);
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(creds.email);
  await page.getByLabel('Password').fill(creds.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
}

async function logout(page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL(/\/login/);
  await page.getByRole('heading', { name: 'Staff sign in' }).waitFor();
}

function mainNav(page) {
  return page.getByRole('navigation', { name: 'Main' });
}

module.exports = {
  CREDENTIALS,
  loginAs,
  logout,
  mainNav,
};
