import { useRouteError } from "react-router-dom";
import { StatusErrorPage } from "./StatusErrorPage";

export function RouteErrorPage() {
  return <StatusErrorPage error={useRouteError()} />;
}
