import { useMemo } from 'react';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return useMemo(() => {
    const isAdmin = role === 'Admin';
    const isDoctor = role === 'Doctor';
    const isNurse = role === 'Nurse';
    const isClinician = isAdmin || isDoctor;

    return {
      role,
      isAdmin,
      isDoctor,
      isNurse,
      canManagePatients: isClinician,
      canManageRecords: isClinician,
      canManageAppointments: isClinician,
      canUpdatePatientStatus: isAdmin || isDoctor || isNurse,
      canRegisterStaff: isAdmin,
    };
  }, [role]);
}
