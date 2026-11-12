import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { RentalMap } from "@/features/stalls/components/RentalMap";
import { useRentalPlan } from "@/features/stalls/hooks/useRentalPlan";
import "@/features/stalls/stalls.css";
import { useAuth } from "@/features/auth/AuthContext";
import { updateDraft, usePartnerDraft } from "../draft";
import { usePendingStallIds } from "../hooks/useRegistrationState";

export function PartnerStallsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const draft = usePartnerDraft();
  const pendingStallIds = usePendingStallIds(Boolean(user));
  const plan = useRentalPlan(draft.rental);
  const { year, items } = plan.state;

  useEffect(() => {
    updateDraft({ rental: { year, items } });
  }, [year, items]);

  if (!draft.kinds.includes("stall")) return <Navigate to="/become-partner" replace />;

  return (
    <div className="stalls-page">
      <div className="stalls-sheet">
        <RentalMap plan={plan} submitLabel="Tiếp tục" lockedIds={pendingStallIds} onBack={() => navigate("/become-partner")} onSubmit={() => navigate("/become-partner/confirm")} />
      </div>
    </div>
  );
}
