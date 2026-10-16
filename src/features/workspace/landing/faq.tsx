"use client";
import { useState } from "react";
import { Accordion, TabPanel, Tabs, useTabsId } from "@/lib/ui";
import { faqCategories, faqItems } from "./landing-data";
import styles from "../landing.module.css";

/** Category tabs above a one-at-a-time accordion. The accordion remounts per category so nothing stays open by accident. */
export function Faq() {
  const base = useTabsId();
  const [value, setValue] = useState<string>(faqCategories[0].key);
  return <div className={styles.faq}>
    <Tabs idBase={base} label="Kategori pertanyaan" items={faqCategories} value={value} onChange={setValue} />
    <TabPanel idBase={base} value={value}><Accordion key={value} items={faqItems[value]} /></TabPanel>
  </div>;
}
