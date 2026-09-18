import type { Metadata, Viewport } from "next";
import { DisplayApp } from "../../components/display/DisplayApp";

export const metadata: Metadata = {
  title: "TCG Timer",
  description: "Pantalla de torneo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function DisplayPage() {
  return <DisplayApp />;
}