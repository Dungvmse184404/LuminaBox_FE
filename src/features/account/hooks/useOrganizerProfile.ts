import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/AuthContext";
import { organizerProfileApi, type OrganizerProfilePayload } from "../api/organizerProfileApi";

export const organizerProfileKey = ["organizer-profile", "me"] as const;

export const useOrganizerProfile = (enabled: boolean) =>
  useQuery({ queryKey: organizerProfileKey, queryFn: organizerProfileApi.mine, enabled });

export function useUpdateOrganizerProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: OrganizerProfilePayload) => organizerProfileApi.update(payload),
    onSuccess: async (profile) => {
      queryClient.setQueryData(organizerProfileKey, profile);
      void queryClient.invalidateQueries({ queryKey: ["store"] });
      setUser(await authApi.me());
    },
  });
}
