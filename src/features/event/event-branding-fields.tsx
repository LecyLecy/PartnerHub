"use client";
import LogoInput from "./logo-input";
import { sponsorLimit, type EventBranding } from "./event-branding";
import styles from "./event-draft.module.css";

export default function EventBrandingFields({branding,update}:{branding:EventBranding;update:(value:EventBranding)=>void}) {
  return <div className={styles.brandingFields}>
    <LogoInput label="Logo acara" value={branding.eventLogo} onChange={eventLogo=>update({...branding,eventLogo})}/>
    <div className={styles.organizerFields}>
      <label>Nama organisasi penyelenggara<input name="organizationName" value={branding.organizationName} maxLength={100} placeholder="Organisasi atau komunitas penyelenggara" onChange={event=>update({...branding,organizationName:event.target.value})}/></label>
      <LogoInput label="Logo organisasi" value={branding.organizationLogo} onChange={organizationLogo=>update({...branding,organizationLogo})}/>
    </div>
    <section className={styles.sponsorEditor} aria-labelledby="sponsor-logos-heading">
      <h3 id="sponsor-logos-heading">Didukung oleh</h3><p>Tambahkan sponsor yang boleh ditampilkan di halaman event. Tidak ada logo merek bawaan.</p>
      {branding.sponsors.map((sponsor,index)=><div key={sponsor.id} className={styles.sponsorEntry}>
        <div className={styles.sponsorEntryTop}>
          <label>Nama sponsor {index+1}<input name={`sponsor-${index}`} value={sponsor.name} maxLength={100} placeholder="Nama perusahaan atau partner" onChange={event=>update({...branding,sponsors:branding.sponsors.map(item=>item.id === sponsor.id ? {...item,name:event.target.value} : item)})}/></label>
          <button type="button" aria-label={`Hapus sponsor ${index+1}`} onClick={()=>update({...branding,sponsors:branding.sponsors.filter(item=>item.id !== sponsor.id)})}>Hapus sponsor</button>
        </div>
        <LogoInput label={`Logo sponsor ${index+1}`} value={sponsor.logo} onChange={logo=>update({...branding,sponsors:branding.sponsors.map(item=>item.id === sponsor.id ? {...item,logo} : item)})}/>
      </div>)}
      <button type="button" className={styles.addSponsor} disabled={branding.sponsors.length >= sponsorLimit} onClick={()=>update({...branding,sponsors:[...branding.sponsors,{id:crypto.randomUUID(),name:"",logo:null}]})}>Tambah sponsor <span>{branding.sponsors.length} / {sponsorLimit}</span></button>
    </section>
    <p className={styles.hint}>Logo opsional. Gunakan hanya gambar yang kamu berhak tampilkan. Salinan lokal menyimpan gambar di browser; simpan server mengunggahnya setelah draft dibuat.</p>
  </div>;
}
