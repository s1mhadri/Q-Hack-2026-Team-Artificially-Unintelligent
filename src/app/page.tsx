"use client";

import { useRouter } from "next/navigation";

const PRODUCTS = [
  { id: "PRO-G-992", name: "Gold Standard Whey", icon: "fitness_center", selected: true },
  { id: "PRO-C-104", name: "Casein Elite Complex", icon: "egg_alt", selected: false },
  { id: "PRO-P-552", name: "Plant Base Isolate", icon: "eco", selected: false },
];

const BOM = [
  {
    name: "Whey Protein Isolate (WPI)",
    grade: "Grade 90% Pure · Raw Material",
    qty: "250,000 kg",
    lead: "12 Weeks",
    leadRisk: true,
    cost: "$14.20/kg",
    primary: true,
  },
  {
    name: "Natural Sweetener (Stevia)",
    grade: "Extract Powder · Additive",
    qty: "4,500 kg",
    lead: "4 Weeks",
    leadRisk: false,
    cost: "$42.50/kg",
    primary: false,
  },
  {
    name: "Cocoa Powder (Alkalized)",
    grade: "Dutch Processed · Flavoring",
    qty: "12,000 kg",
    lead: "6 Weeks",
    leadRisk: false,
    cost: "$8.15/kg",
    primary: false,
  },
  {
    name: "Packaging - 2lb Tub",
    grade: "BPA-Free Matte Black · Containment",
    qty: "50,000 units",
    lead: "3 Weeks",
    leadRisk: false,
    cost: "$1.12/unit",
    primary: false,
  },
];

export default function SelectionPage() {
  const router = useRouter();

  const startAnalysis = (ingredient: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("agnes_ingredient", ingredient);
      localStorage.setItem("agnes_layer1", "");
      localStorage.setItem("agnes_layer2", "");
      localStorage.setItem("agnes_layer3", "");
      localStorage.setItem("agnes_layer4", "");
    }
    router.push("/requirements");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb + Title */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[0.7rem] font-bold tracking-widest uppercase text-on-surface-variant">
            Enterprise Procurement
          </span>
          <span className="text-outline-variant">/</span>
          <span className="text-[0.7rem] font-bold tracking-widest uppercase text-primary">
            Agnes Sport Protein Co
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
          Product &amp; BOM Selection
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          Select a product and identify which BOM component to find a substitute for.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Product Column */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Active Portfolio</h2>
            <span className="text-[0.7rem] font-bold text-tertiary px-2 py-0.5 bg-tertiary-container/20 rounded">
              32 Active SKUs
            </span>
          </div>

          <div className="space-y-2">
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                className={`p-4 bg-white rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  p.selected
                    ? "border-2 border-primary shadow-sm"
                    : "border border-surface-container hover:border-outline-variant/30 group"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      p.selected ? "bg-primary/5" : "bg-surface-container"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${p.selected ? "text-primary" : "text-outline-variant"}`}
                      style={p.selected ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {p.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface leading-none mb-1">{p.name}</p>
                    <p className="text-[0.65rem] text-on-surface-variant font-medium uppercase tracking-tighter">
                      SKU: {p.id}
                    </p>
                  </div>
                </div>
                {p.selected && (
                  <span className="material-symbols-outlined text-primary text-xl fill-icon">check_circle</span>
                )}
              </div>
            ))}
          </div>

          <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Import New SKU
          </button>
        </div>

        {/* BOM Module */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl border border-surface-container shadow-sm overflow-hidden">
            {/* BOM Header */}
            <div className="p-6 border-b border-surface-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Bill of Materials (BOM)</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  Gold Standard Whey • Batch ID: #B-8802
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.6rem] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                  Target for Substitution
                </p>
                <p className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                  Whey Protein Isolate (WPI)
                  <span className="material-symbols-outlined text-[16px]">info</span>
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-lowest">
                    <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
                      Component Name
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
                      Lead Time
                    </th>
                    <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
                      Unit Cost
                    </th>
                    <th className="px-6 py-4 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {BOM.map((row) => (
                    <tr
                      key={row.name}
                      className={row.primary ? "bg-primary/5" : "hover:bg-surface-container-lowest transition-colors"}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              row.primary ? "bg-primary animate-pulse" : "bg-outline-variant/30"
                            }`}
                          />
                          <div>
                            <p className={`text-sm leading-tight ${row.primary ? "font-bold text-on-surface" : "font-medium text-on-surface"}`}>
                              {row.name}
                            </p>
                            <p className="text-[0.7rem] text-on-surface-variant mt-0.5">{row.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-5 text-sm ${row.primary ? "font-semibold text-on-surface" : "text-on-surface"}`}>
                        {row.qty}
                      </td>
                      <td className="px-6 py-5">
                        {row.leadRisk ? (
                          <span className="text-xs text-error font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                            {row.lead}
                          </span>
                        ) : (
                          <span className="text-sm text-on-surface">{row.lead}</span>
                        )}
                      </td>
                      <td className={`px-6 py-5 text-sm ${row.primary ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}>
                        {row.cost}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {row.primary ? (
                          <button
                            onClick={() => startAnalysis("Whey Protein Isolate")}
                            className="primary-gradient text-on-primary px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 ml-auto"
                          >
                            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                            Find Substitute
                          </button>
                        ) : (
                          <span className="material-symbols-outlined text-outline-variant cursor-pointer hover:text-on-surface">
                            more_vert
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BOM Footer */}
            <div className="p-6 bg-surface-container-lowest border-t border-surface-container flex justify-between items-center">
              <p className="text-[0.7rem] text-on-surface-variant font-medium">BOM Last Updated: Oct 24, 2023</p>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 text-xs font-bold text-on-surface border border-outline-variant/30 rounded-md hover:bg-surface-container-low transition-all">
                  Export BOM
                </button>
                <button className="px-4 py-1.5 text-xs font-bold text-on-surface border border-outline-variant/30 rounded-md hover:bg-surface-container-low transition-all">
                  Historical Pricing
                </button>
              </div>
            </div>
          </div>

          {/* Intelligence insight */}
          <div className="mt-4 p-4 bg-error-container/10 border border-error/20 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-xl mt-0.5 fill-icon">warning</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Supply Risk Detected</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                WPI has a 12-week lead time and is sourced from a single Tier-1 supplier. Click{" "}
                <button
                  onClick={() => startAnalysis("Whey Protein Isolate")}
                  className="text-primary font-bold underline decoration-primary/40 hover:decoration-primary"
                >
                  Find Substitute
                </button>{" "}
                to run the Agnes AI pipeline and discover validated alternatives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
