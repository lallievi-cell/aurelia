import { type Staff, type Role } from "@/tycoon/model";

export type VeteranPerk = {
  id: string;
  name: string;
  note: string;
};

export const VETERAN_PERKS: Record<Role, VeteranPerk[]> = {
  operator: [
    { id: "op_zero_waste", name: "Maestro di Linea", note: "Rischio di scarto ridotto quasi a zero." },
    { id: "op_turbo", name: "Cadenza Massima", note: "La linea va il 20% più rapida." },
  ],
  qa: [
    { id: "qa_falcon", name: "Occhio di Falco", note: "La copertura del QC sale di +8." },
    { id: "qa_bulletproof", name: "Audit Blindato", note: "Immune a multe o rilievi delle autorità." },
  ],
  scientist: [
    { id: "sci_breakthrough", name: "Genio Sintetico", note: "Produce +50% scienza a settimana." },
    { id: "sci_de_risk", name: "Preveggenza Molecolare", note: "Rischio di fallimento nei trial dimezzato." },
  ],
  clinical: [
    { id: "clin_fast_track", name: "Fast Track Leader", note: "Le fasi cliniche scorrono il 25% più svelte." },
    { id: "clin_patient_care", name: "Protocollo Perfetto", note: "Eventi avversi durante i trial azzerati." },
  ],
  regulatory: [
    { id: "reg_direct_line", name: "Linea Diretta FDA/EMA", note: "L'autorità approva 2 settimane prima." },
    { id: "reg_ironclad", name: "Dossier Inattaccabile", note: "Probabilità di rinvio del dossier annullata." },
  ],
  commercial: [
    { id: "com_closer", name: "Grande Negoziatore", note: "I contratti pagano il 18% in più." },
    { id: "com_network", name: "Rete Internazionale", note: "Arrivano sempre 4 buste sul tavolo." },
  ],
};

export function xpForSkill(skill: number): number {
  const table = [0, 80, 200, 420, 780, 1300, 2200];
  return table[Math.min(table.length - 1, skill)] ?? 2200;
}

export function grantStaffWorkXP(staff: Staff, roleMatch: boolean): { leveledUp: boolean; newSkill: number; veteranPerk?: VeteranPerk } {
  // ensure staff has xp and morale fields
  const s = staff as Staff & { xp?: number; morale?: number; veteran?: VeteranPerk };
  s.xp = (s.xp ?? 0) + (roleMatch ? 12 : 4);
  s.morale = Math.max(0, Math.min(100, s.morale ?? 75));

  const needed = xpForSkill(s.skill);
  if (s.xp >= needed && s.skill < 6) {
    s.skill += 1;
    s.salary = Math.round(s.salary * 1.08);
    s.morale = Math.min(100, s.morale + 15);

    let perk: VeteranPerk | undefined;
    if (s.skill >= 5 && !s.veteran) {
      const perks = VETERAN_PERKS[s.role] || [];
      perk = perks[Math.floor(Math.random() * perks.length)];
      s.veteran = perk;
    }
    return { leveledUp: true, newSkill: s.skill, veteranPerk: perk };
  }

  return { leveledUp: false, newSkill: s.skill };
}
