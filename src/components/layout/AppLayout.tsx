import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AmbientBackground } from "@/components/ambient/AmbientBackground";
import { BackToTop } from "@/components/layout/BackToTop";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const PLAIN_SECTIONS = /^\/(store|admin)(\/|$)/;

export function AppLayout() {
  const { pathname } = useLocation();
  const showAmbient = !PLAIN_SECTIONS.test(pathname);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {showAmbient && <AmbientBackground />}
      <Header />
      <main key={pathname} className="lb-page-enter flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
