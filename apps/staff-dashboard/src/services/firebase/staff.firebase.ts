import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useStaffStore } from '../../store/staff.store';
import { StaffMember } from '../../types/staff.types';

export function subscribeToStaffLocations(): Unsubscribe {
  const store = useStaffStore.getState();

  // Assuming /staff contains all globally or we scope by venue
  const staffRef = collection(firestore, `staff`);
  
  const unsubscribe = onSnapshot(staffRef, (snapshot) => {
    if (snapshot.empty) return;
    
    const members: StaffMember[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.location || data.active !== undefined) {
         members.push({
           staffId: doc.id,
           ...data
         } as StaffMember);
      }
    });
    
    store.setAllStaff(members);
  }, (error) => {
    console.error(`[Firebase] Error fetching staff locations:`, error);
  });

  return unsubscribe;
}
