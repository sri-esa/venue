import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { StaffMember, StaffAssignment } from '../types/staff.types';

interface StaffState {
  staff: Record<string, StaffMember>;
  assignments: Record<string, StaffAssignment[]>;
  selectedStaffId: string | null;
}

interface StaffActions {
  setStaffMember: (staff: StaffMember) => void;
  setAllStaff: (staff: StaffMember[]) => void;
  setAssignments: (staffId: string, assignments: StaffAssignment[]) => void;
  setSelectedStaffId: (id: string | null) => void;
}

export const useStaffStore = create<StaffState & StaffActions>()(
  subscribeWithSelector(
    immer((set) => ({
      staff: {},
      assignments: {},
      selectedStaffId: null,

      setStaffMember: (member) => set((state) => {
        state.staff[member.staffId] = member;
      }),
      setAllStaff: (staffList) => set((state) => {
        staffList.forEach(s => { state.staff[s.staffId] = s; });
      }),
      setAssignments: (staffId, assignmentsList) => set((state) => {
        state.assignments[staffId] = assignmentsList;
      }),
      setSelectedStaffId: (id) => set((state) => { state.selectedStaffId = id; }),
    }))
  )
);

// Selectors — useShallow prevents new array refs causing infinite re-renders
export const useStaffByZone = (zoneId: string) => useStaffStore(useShallow(state =>
  Object.values(state.staff).filter(s => s.assignedZone === zoneId)
));

export const useUnassignedStaff = () => useStaffStore(useShallow(state =>
  Object.values(state.staff).filter(s => s.active && !s.assignedZone)
));

export const useOnDutyCount = () => useStaffStore(state =>
  Object.values(state.staff).filter(s => s.active).length
);
