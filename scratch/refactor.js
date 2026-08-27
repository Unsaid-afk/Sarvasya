const fs = require('fs');

const path = 'C:/Users/aarya/Desktop/work/accessibility yi/Asset-Manager/Asset-Manager/artifacts/sugamya-setu/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add missing imports
if (!content.includes('useListComplaints')) {
  content = content.replace(
    /import { useGetBuilding, [^}]+ } from '@workspace\/api-client-react';/,
    `import { 
  useGetBuilding, useGetDashboardSummary, useListBuildings, useRunComplianceCheck, useSubmitAudit, 
  useListComplaints, useListNGOs, useListVolunteerBookings, useListSafeSpots,
  useSubmitComplaint, useUpdateComplaintStatus, useCreateVolunteerBooking, useCreateSafeSpot,
  useGetUserStrikes,
  getGetBuildingQueryKey, getGetDashboardSummaryQueryKey, getListBuildingsQueryKey 
} from '@workspace/api-client-react';`
  );
}

// 2. Remove static mock data (lines from // Offline... down to the BrandMark function)
const mockDataRegex = /\/\/ Offline & Local Storage Mock Database Setup[\s\S]*?(?=function BrandMark)/;
content = content.replace(mockDataRegex, '');

// 3. Replace the `useMockDB` implementation
const mockDbRegex = /\/\/ Global state hooks \/ helper for Offline-First mock database[\s\S]*?(?=function Shell)/;

const newHookImplementation = `// Global state hooks replaced by React Query API wrappers
function useAppAPI() {
  const { data: buildingsData } = useListBuildings();
  const { data: complaintsData, refetch: refetchComplaints } = useListComplaints();
  const { data: volunteersData, refetch: refetchVolunteers } = useListVolunteerBookings();
  const { data: safeSpotsData, refetch: refetchSafeSpots } = useListSafeSpots();
  
  const submitComplaint = useSubmitComplaint();
  const updateComplaint = useUpdateComplaintStatus();
  const submitVolunteer = useCreateVolunteerBooking();
  const submitSafeSpot = useCreateSafeSpot();

  const [profile, setProfile] = useState<any>(() => {
    const cached = localStorage.getItem("sarvasya_profile");
    return cached ? JSON.parse(cached) : { name: "Asha Rao", role: "citizen", email: "asha@accessnow.org", fakeStrikes: 0 };
  });

  const { data: strikesData } = useGetUserStrikes(profile.name, { query: { enabled: !!profile.name } });

  const registerUser = (user: any) => {
    setProfile(user);
    localStorage.setItem("sarvasya_profile", JSON.stringify(user));
  };

  const addComplaint = async (complaint: any) => {
    await submitComplaint.mutateAsync({ data: complaint });
    refetchComplaints();
  };

  const updateComplaintStatus = async (id: string, status: string, reason?: string) => {
    await updateComplaint.mutateAsync({ id, data: { status, dismissReason: reason } });
    refetchComplaints();
  };

  const addVolunteerBooking = async (booking: any) => {
    await submitVolunteer.mutateAsync({ data: booking });
    refetchVolunteers();
  };

  const addSafeSpot = async (spot: any) => {
    await submitSafeSpot.mutateAsync({ data: spot });
    refetchSafeSpots();
  };

  const actualProfile = {
    ...profile,
    fakeStrikes: strikesData?.strikes ?? profile.fakeStrikes
  };

  return {
    buildings: buildingsData || [],
    complaints: complaintsData || [],
    volunteers: volunteersData || [],
    safeSpots: safeSpotsData || [],
    profile: actualProfile,
    addComplaint,
    updateComplaintStatus,
    addVolunteerBooking,
    addSafeSpot,
    registerUser
  };
}

`;

content = content.replace(mockDbRegex, newHookImplementation);

// 4. Rename all references to `useMockDB` in the rest of the file
content = content.replace(/useMockDB/g, 'useAppAPI');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored App.tsx');
