"use client";

import {
  Languages,
  Calculator,
  Landmark,
  Cpu,
  Terminal,
  BookOpen,
  Church,
  CircuitBoard,
  Radio,
  Network,
  Server,
  Dumbbell,
  Router,
  type LucideIcon,
} from "lucide-react";
import type { SubjectKey } from "@/lib/schedule";

const ICONS: Record<string, LucideIcon> = {
  Languages,
  Calculator,
  Landmark,
  Cpu,
  Terminal,
  BookOpen,
  Church,
  CircuitBoard,
  Radio,
  Network,
  Server,
  Dumbbell,
  Router,
};

export function SubjectIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = ICONS[name] ?? BookOpen;
  return <Cmp className={className} />;
}

export { ICONS };
