import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { AboutSection } from "../components/AboutSection";
import { CategoryShortcuts } from "../components/CategoryShortcuts";
import { FeatureTiles } from "../components/FeatureTiles";
import { PartnerSection } from "../components/PartnerSection";

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <Container className="space-y-10 py-6">
      <FeatureTiles />
      <CategoryShortcuts />
      <PartnerSection />
      <AboutSection />
    </Container>
  );
}
