import { createFileRoute } from "@tanstack/react-router";
import { AureliaGame } from "@/components/AureliaGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AureliaGame />;
}
