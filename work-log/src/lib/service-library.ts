// ============================================================
// Service Library — single source of truth for all services
// Changes here → frontend automatically updates
// ============================================================

export type ServiceCategory = "massage" | "facial" | "oil" | "project";

export interface ServiceDef {
  id: string;
  category: ServiceCategory;
  name: string;
  shortName: string;
  price: number;
  durationMinutes: number;
  enabled: boolean;
  sortOrder: number;
}

// ============================================================
// Massage hierarchy: Category → Service → Duration
// ============================================================

export interface MassageDuration {
  minutes: number;
  price: number;
  shortName: string;
}

export interface MassageService {
  id: string;
  name: string;
  durations: MassageDuration[];
}

export interface MassageCategory {
  name: string;
  services: MassageService[];
}

export const MASSAGE_MENU: MassageCategory[] = [
  {
    name: "Quick Relief",
    services: [
      {
        id: "back",
        name: "Back Massage",
        durations: [
          { minutes: 30, price: 50, shortName: "50按" },
        ],
      },
      {
        id: "neck-back",
        name: "Neck, Shoulders & Back",
        durations: [
          { minutes: 30, price: 60, shortName: "60按" },
        ],
      },
    ],
  },
  {
    name: "Full Body",
    services: [
      {
        id: "swedish",
        name: "Swedish",
        durations: [
          { minutes: 60, price: 75, shortName: "75按" },
          { minutes: 90, price: 115, shortName: "115按" },
        ],
      },
      {
        id: "deep-tissue",
        name: "Deep Tissue",
        durations: [
          { minutes: 60, price: 80, shortName: "80按" },
          { minutes: 90, price: 120, shortName: "120按" },
        ],
      },
      {
        id: "pain-relief",
        name: "Pain Relief",
        durations: [
          { minutes: 60, price: 100, shortName: "100按" },
          { minutes: 90, price: 135, shortName: "135按" },
        ],
      },
      {
        id: "lymphatic",
        name: "Lymphatic",
        durations: [
          { minutes: 60, price: 100, shortName: "100按" },
          { minutes: 90, price: 140, shortName: "140按" },
        ],
      },
      {
        id: "prenatal",
        name: "Prenatal",
        durations: [
          { minutes: 60, price: 80, shortName: "80按" },
          { minutes: 90, price: 120, shortName: "120按" },
        ],
      },
    ],
  },
  {
    name: "Foot Care",
    services: [
      {
        id: "foot-back",
        name: "Foot + Back",
        durations: [
          { minutes: 60, price: 70, shortName: "70按" },
          { minutes: 90, price: 110, shortName: "110按" },
        ],
      },
      {
        id: "foot-soak",
        name: "Foot Soak",
        durations: [
          { minutes: 30, price: 50, shortName: "50按" },
          { minutes: 60, price: 70, shortName: "70按" },
        ],
      },
      {
        id: "foot-reflex",
        name: "Foot Reflexology",
        durations: [
          { minutes: 30, price: 40, shortName: "40按" },
          { minutes: 60, price: 65, shortName: "65按" },
        ],
      },
    ],
  },
];

// ============================================================
// Add-on definitions (Projects)
// Price + duration are mapped from dictionary — no manual entry
// ============================================================

export interface AddonDef {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  shortName: string;
  enabled: boolean;
  sortOrder: number;
}

export const ADDON_LIBRARY: AddonDef[] = [
  { id: "addon-back-gua",    name: "Back Gua Sha",       price: 40, durationMinutes: 30, shortName: "背刮40", enabled: true, sortOrder: 1 },
  { id: "addon-cupping",     name: "Cupping",             price: 20, durationMinutes: 10, shortName: "拔20",   enabled: true, sortOrder: 2 },
  { id: "addon-lymphatic",   name: "Lymphatic Add-on",    price: 20, durationMinutes: 10, shortName: "淋20",   enabled: true, sortOrder: 3 },
  { id: "addon-thai-stretch",name: "Thai Stretch",        price: 15, durationMinutes: 10, shortName: "拉15",   enabled: true, sortOrder: 4 },
  { id: "addon-scalp-gua",   name: "Scalp Gua Sha",       price: 10, durationMinutes: 10, shortName: "头刮10", enabled: true, sortOrder: 5 },
  { id: "addon-extra-30",    name: "Extra 30 Minutes",    price: 40, durationMinutes: 30, shortName: "加30",   enabled: true, sortOrder: 6 },
];

// ============================================================
// Flat service list (for backward compatibility with facial, oil)
// ============================================================

export const SERVICE_LIBRARY: ServiceDef[] = [
  // Facial
  { id: "facial-essential", category: "facial", name: "Essential Glow", shortName: "35美", price: 35,  durationMinutes: 30, enabled: true, sortOrder: 1 },
  { id: "facial-hydra",     category: "facial", name: "Hydra Renew",    shortName: "75美", price: 75,  durationMinutes: 45, enabled: true, sortOrder: 2 },
  { id: "facial-radiance",  category: "facial", name: "Radiance Luxe",  shortName: "115美", price: 115, durationMinutes: 60, enabled: true, sortOrder: 3 },

  // Oil
  { id: "oil-5",  category: "oil", name: "Oil +$5",  shortName: "油5",  price: 5,  durationMinutes: 0, enabled: true, sortOrder: 4 },
  { id: "oil-10", category: "oil", name: "Oil +$10", shortName: "油10", price: 10, durationMinutes: 0, enabled: true, sortOrder: 5 },
  { id: "oil-cbd", category: "oil", name: "CBD +$20", shortName: "CBD20", price: 20, durationMinutes: 0, enabled: true, sortOrder: 6 },
];

/** Get flat services by category */
export function getServicesByCategory(category: ServiceCategory): ServiceDef[] {
  return SERVICE_LIBRARY
    .filter((s) => s.category === category && s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get enabled add-ons */
export function getEnabledAddons(): AddonDef[] {
  return ADDON_LIBRARY.filter((a) => a.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Find an add-on by id */
export function getAddonById(id: string): AddonDef | undefined {
  return ADDON_LIBRARY.find((a) => a.id === id);
}

/** Find a service by id */
export function getServiceById(id: string): ServiceDef | undefined {
  return SERVICE_LIBRARY.find((s) => s.id === id);
}

/** Find a massage duration by service id and minutes */
export function getMassageDuration(serviceId: string, minutes: number): { price: number; shortName: string } | null {
  for (const cat of MASSAGE_MENU) {
    for (const svc of cat.services) {
      if (svc.id === serviceId) {
        const dur = svc.durations.find((d) => d.minutes === minutes);
        if (dur) return { price: dur.price, shortName: dur.shortName };
      }
    }
  }
  return null;
}