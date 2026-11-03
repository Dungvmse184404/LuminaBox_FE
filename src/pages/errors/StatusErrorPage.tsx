import { errorMessage, errorStatus } from "@/lib/errors";
import { ForbiddenPage } from "./ForbiddenPage";
import { NetworkErrorPage } from "./NetworkErrorPage";
import { NotFoundPage } from "./NotFoundPage";
import { ServerErrorPage } from "./ServerErrorPage";
import { UnauthorizedPage } from "./UnauthorizedPage";

export function StatusErrorPage({ error }: { error: unknown }) {
  const status = errorStatus(error);

  if (status === 0) return <NetworkErrorPage />;
  if (status === 401) return <UnauthorizedPage />;
  if (status === 403) return <ForbiddenPage />;
  if (status === 404) return <NotFoundPage />;
  return <ServerErrorPage detail={errorMessage(error)} />;
}
