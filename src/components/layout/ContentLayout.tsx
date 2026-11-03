import { Outlet } from "react-router-dom";
import { Container } from "@/components/layout/Container";

export function ContentLayout() {
  return (
    <Container className="py-8">
      <Outlet />
    </Container>
  );
}
