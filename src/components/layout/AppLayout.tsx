import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AmbientBackground } from "@/components/ambient/AmbientBackground";
import { BackToTop } from "@/components/layout/BackToTop";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const PLAIN_SECTIONS = /^\/(store|admin)(\/|$)/;
const FULL_SCREEN_PAGES = /^\/stalls\/?$/;

export function AppLayout() {
  const { pathname } = useLocation();
  const showAmbient = !PLAIN_SECTIONS.test(pathname);
  const fullScreen = FULL_SCREEN_PAGES.test(pathname);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className={fullScreen ? "flex h-dvh flex-col overflow-hidden" : "flex min-h-screen flex-col"}>
      {showAmbient && <AmbientBackground />}
      <Header />
      <main key={pathname} className={fullScreen ? "relative min-h-0 flex-1 overflow-hidden" : "lb-page-enter flex-1"}>
        <Outlet />
      </main>
      <Footer compact={fullScreen} />
      <BackToTop />
    </div>
  );
}
