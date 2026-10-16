"use client";
import type { ReactNode } from "react";
import { SessionGate } from "./session";
import { SiteFrame } from "./ui/site-frame";
import styles from "./ui.module.css";

export { SiteFrame };
export { BackLink, Badge, Breadcrumb, Button, Card, EmptyState, Loading, Notice, PageTitle, Skeleton } from "./ui/primitives";
export { Accordion, type AccordionItem } from "./ui/accordion";
export { AvatarStack } from "./ui/avatar-stack";
export { DataTable, type Column } from "./ui/data-table";
export { Marquee } from "./ui/marquee";
export { TabPanel, Tabs, useTabsId, type TabItem } from "./ui/tabs";
export { Timeline, type TimelineItem } from "./ui/timeline";
export { Toggle } from "./ui/toggle";
export { Meter, PageHeader, SkeletonCards, StatGrid, type Stat } from "./ui/stats";
export { DetailSection, EventCard, EventGrid, InfoCard, OrganizerAvatar, type CardCover } from "./ui/event-card";
export { SelectionSteps, type Step } from "./ui/selection-steps";
export { AccountMenu } from "./ui/account-menu";
export { NotificationMenu } from "./ui/notification-menu";
export { ToastProvider, useToast } from "./ui/toast";
export { styles as uiStyles };

export function ProtectedPage({ children, onboarding = false, allowUnverified = false }: { children: ReactNode; onboarding?: boolean; allowUnverified?: boolean }) {
  return <SessionGate allowOnboarding={onboarding} allowUnverified={allowUnverified}><SiteFrame>{children}</SiteFrame></SessionGate>;
}

