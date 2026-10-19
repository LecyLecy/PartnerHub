import { faqItems } from "./landing-data";
import styles from "../landing.module.css";

/** Short answers stay visible without disclosure controls. */
export function Faq() {
  return <div className={styles.faq}>{faqItems.umum.map(item => <section key={item.key} aria-labelledby={`faq-${item.key}`}><h3 id={`faq-${item.key}`}>{item.question}</h3><p>{item.answer}</p></section>)}</div>;
}
