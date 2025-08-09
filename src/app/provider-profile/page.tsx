"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

// Country/region lists for per-state pricing
type CountryKey = "US" | "AU" | "NZ";
const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];
const AU_STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];
const NZ_REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatu-Whanganui",
  "Wellington",
  "Tasman",
  "Nelson",
  "Marlborough",
  "West Coast",
  "Canterbury",
  "Otago",
  "Southland",
];

export default function ProviderProfile() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [keybaseHandle, setKeybaseHandle] = useState("");
  // Shipping form state
  const [mode, setMode] = useState<"FLAT" | "REGION_BASED">("REGION_BASED");
  const [flatFeeSats, setFlatFeeSats] = useState<number>(0);
  const [selectedCountries, setSelectedCountries] = useState<
    Record<CountryKey, boolean>
  >({ US: false, AU: false, NZ: false });
  const [countrySingleFee, setCountrySingleFee] = useState<
    Record<CountryKey, number>
  >({ US: 0, AU: 0, NZ: 0 });
  const [usePerState, setUsePerState] = useState<Record<CountryKey, boolean>>({
    US: false,
    AU: false,
    NZ: false,
  });
  const [perStateFees, setPerStateFees] = useState<
    Record<CountryKey, Record<string, number>>
  >({ US: {}, AU: {}, NZ: {} });

  // Materials & add-ons form state
  const [sleeveLitePrice, setSleeveLitePrice] = useState<number>(0);
  const [sleevePremiumPrice, setSleevePremiumPrice] = useState<number>(0);
  const [blankPlatePrice, setBlankPlatePrice] = useState<number>(0);
  const [seedPickerCardPrice, setSeedPickerCardPrice] = useState<number>(0);
  const [entropiaPillPrice, setEntropiaPillPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<"USD" | "AUD" | "NZD">("USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("username");
    if (!id) {
      router.push("/login");
      return;
    }
    setProviderId(id);
    setUsername(name || "");
    // Fetch existing config
    fetch(`/api/providers/config?providerId=${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((cfg) => {
        if (cfg.keybaseHandle) setKeybaseHandle(cfg.keybaseHandle);
        if (cfg.shippingPolicyDefault) {
          const sp = cfg.shippingPolicyDefault;
          if (sp.mode === "FLAT") {
            setMode("FLAT");
            const satsPerUsdEnv =
              process.env.NEXT_PUBLIC_SATS_PER_USD || process.env.SATS_PER_USD;
            const satsPerUsd = satsPerUsdEnv ? Number(satsPerUsdEnv) : 5000;
            setFlatFeeSats(
              Math.round((sp.flatFeeSats || 0) / (satsPerUsd || 1))
            );
            const sel = { US: false, AU: false, NZ: false } as Record<
              CountryKey,
              boolean
            >;
            for (const r of sp.shipsTo || []) {
              if (r.regionCode === "US") sel.US = true;
              if (r.regionCode === "AU") sel.AU = true;
              if (r.regionCode === "NZ") sel.NZ = true;
            }
            setSelectedCountries(sel);
          } else {
            setMode("REGION_BASED");
            const sel = { US: false, AU: false, NZ: false } as Record<
              CountryKey,
              boolean
            >;
            const single = { US: 0, AU: 0, NZ: 0 } as Record<
              CountryKey,
              number
            >;
            const perState: Record<CountryKey, Record<string, number>> = {
              US: {},
              AU: {},
              NZ: {},
            };
            const perStateFlags: Record<CountryKey, boolean> = {
              US: false,
              AU: false,
              NZ: false,
            };
            const satsPerUsdEnv =
              process.env.NEXT_PUBLIC_SATS_PER_USD || process.env.SATS_PER_USD;
            const satsPerUsd = satsPerUsdEnv ? Number(satsPerUsdEnv) : 5000;
            for (const r of sp.regions || []) {
              const code: string = r.regionCode || "";
              if (["US", "AU", "NZ"].includes(code)) {
                sel[code as CountryKey] = true;
                single[code as CountryKey] = Math.round(
                  (r.baseFeeSats || 0) / (satsPerUsd || 1)
                );
                continue;
              }
              // Per-state entries like US-California
              const dashIdx = code.indexOf("-");
              if (dashIdx > 0) {
                const country = code.substring(0, dashIdx) as CountryKey;
                const stateName = code.substring(dashIdx + 1);
                if (["US", "AU", "NZ"].includes(country)) {
                  sel[country] = true;
                  perStateFlags[country] = true;
                  perState[country][stateName] = Math.round(
                    (r.baseFeeSats || 0) / (satsPerUsd || 1)
                  );
                }
              }
            }
            setSelectedCountries(sel);
            setCountrySingleFee(single);
            setUsePerState(perStateFlags);
            setPerStateFees(perState);
          }
        }
        if (cfg.materialsCatalog) {
          const cat = cfg.materialsCatalog;
          const lite = (cat.sleeves || []).find(
            (s: any) => s.sku === "SLV-LITE"
          );
          const prem = (cat.sleeves || []).find(
            (s: any) => s.sku === "SLV-PREMIUM"
          );
          const satsPerUsdEnv2 =
            process.env.NEXT_PUBLIC_SATS_PER_USD || process.env.SATS_PER_USD;
          const satsPerUsd2 = satsPerUsdEnv2 ? Number(satsPerUsdEnv2) : 5000;
          const toUsdDollars = (sats: number) =>
            Math.round((sats || 0) / (satsPerUsd2 || 1));
          if (lite)
            setSleeveLitePrice(
              typeof lite.priceUsd === "number"
                ? Math.round(lite.priceUsd)
                : toUsdDollars(lite.priceSats || 0)
            );
          if (prem)
            setSleevePremiumPrice(
              typeof prem.priceUsd === "number"
                ? Math.round(prem.priceUsd)
                : toUsdDollars(prem.priceSats || 0)
            );
          const plate = (cat.blankPlates || []).find(
            (p: any) => p.sku === "PLT-SS-STEEL"
          );
          if (plate)
            setBlankPlatePrice(
              typeof plate.priceUsd === "number"
                ? Math.round(plate.priceUsd)
                : toUsdDollars(plate.priceSats || 0)
            );
          const spc = (cat.seedPickerCards || []).find(
            (a: any) => a.sku === "ACC-SEEDPICK"
          );
          if (spc)
            setSeedPickerCardPrice(
              typeof spc.priceUsd === "number"
                ? Math.round(spc.priceUsd)
                : toUsdDollars(spc.priceSats || 0)
            );
          const ent = (cat.entropiaPills || []).find(
            (a: any) => a.sku === "ACC-ENTROPIA"
          );
          if (ent)
            setEntropiaPillPrice(
              typeof ent.priceUsd === "number"
                ? Math.round(ent.priceUsd)
                : toUsdDollars(ent.priceSats || 0)
            );
        }
      })
      .catch(() => {});
  }, [router]);

  // Build payloads for server
  const regionsForCountry = (ck: CountryKey) => {
    const list = ck === "US" ? US_STATES : ck === "AU" ? AU_STATES : NZ_REGIONS;
    if (usePerState[ck]) {
      return list
        .filter((name) => (perStateFees[ck] || {})[name] > 0)
        .map((name) => ({
          continent: ck === "US" ? "NA" : "OC",
          regionCode: `${ck}-${name}`,
          regionName: name,
          baseFeeSats: (perStateFees[ck] || {})[name],
        }));
    }
    const fee = countrySingleFee[ck];
    if (fee && fee > 0) {
      return [
        {
          continent: ck === "US" ? "NA" : "OC",
          regionCode: ck,
          regionName:
            ck === "US"
              ? "United States"
              : ck === "AU"
              ? "Australia"
              : "New Zealand",
          baseFeeSats: fee,
        },
      ];
    }
    return [];
  };

  const shippingPolicyDefault = useMemo(() => {
    if (mode === "FLAT") {
      const shipsTo: any[] = [];
      if (selectedCountries.US)
        shipsTo.push({
          continent: "NA",
          regionCode: "US",
          regionName: "United States",
        });
      if (selectedCountries.AU)
        shipsTo.push({
          continent: "OC",
          regionCode: "AU",
          regionName: "Australia",
        });
      if (selectedCountries.NZ)
        shipsTo.push({
          continent: "OC",
          regionCode: "NZ",
          regionName: "New Zealand",
        });
      return { mode: "FLAT", flatFeeSats, shipsTo };
    }
    const regions = [
      ...(selectedCountries.US ? regionsForCountry("US") : []),
      ...(selectedCountries.AU ? regionsForCountry("AU") : []),
      ...(selectedCountries.NZ ? regionsForCountry("NZ") : []),
    ];
    return { mode: "REGION_BASED", regions };
  }, [
    mode,
    flatFeeSats,
    selectedCountries,
    countrySingleFee,
    perStateFees,
    usePerState,
  ]);

  const materialsCatalog = useMemo(() => {
    const sleeves: any[] = [];
    if (sleeveLitePrice > 0)
      sleeves.push({
        sku: "SLV-LITE",
        name: "Sleeve Lite",
        description: "standard mailer",
        priceSats: sleeveLitePrice,
        shipUnits: 0.1,
      });
    if (sleevePremiumPrice > 0)
      sleeves.push({
        sku: "SLV-PREMIUM",
        name: "Sleeve Premium",
        description: "tamper-evident",
        priceSats: sleevePremiumPrice,
        shipUnits: 0.1,
      });
    const blankPlates: any[] = [];
    if (blankPlatePrice > 0)
      blankPlates.push({
        sku: "PLT-SS-STEEL",
        name: "Steel Plate",
        description: "316L",
        priceSats: blankPlatePrice,
        shipUnits: 1,
      });
    const seedPickerCards: any[] = [];
    if (seedPickerCardPrice > 0)
      seedPickerCards.push({
        sku: "ACC-SEEDPICK",
        name: "Seed Picker Card",
        description: "character picker",
        priceSats: seedPickerCardPrice,
        shipUnits: 0.2,
      });
    const entropiaPills: any[] = [];
    if (entropiaPillPrice > 0)
      entropiaPills.push({
        sku: "ACC-ENTROPIA",
        name: "Entropia Pill",
        description: "entropy aid",
        priceSats: entropiaPillPrice,
        shipUnits: 2,
      });
    return { sleeves, blankPlates, seedPickerCards, entropiaPills };
  }, [
    sleeveLitePrice,
    sleevePremiumPrice,
    blankPlatePrice,
    seedPickerCardPrice,
    entropiaPillPrice,
  ]);

  const save = async () => {
    if (!providerId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/providers/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          username,
          keybaseHandle,
          shippingPolicyDefault: shippingPolicy,
          materialsCatalog,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      setSuccess("Saved");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Provider Profile
        </h1>
        {error && (
          <div className="mb-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 text-green-600 dark:text-green-400 text-sm">
            {success}
          </div>
        )}
        <div className="space-y-6">
          {/* Currency selector */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <div className="relative inline-block w-full">
              <select
                className="w-full appearance-none pr-10 px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                <option value="USD">USD</option>
                <option value="AUD">AUD</option>
                <option value="NZD">NZD</option>
              </select>
              <svg
                className="pointer-events-none absolute right-2 mr-1 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Keybase Profile URL
            </label>
            <input
              placeholder="https://keybase.io/yourname"
              className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
              value={keybaseHandle}
              onChange={(e) => setKeybaseHandle(e.target.value)}
              onBlur={async () => {
                if (!keybaseHandle) return;
                try {
                  const r = await fetch("/api/providers/validate-keybase", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ keybase: keybaseHandle }),
                  });
                  const d = await r.json();
                  if (!r.ok || !d.isValid) {
                    setError(d.error || "Invalid Keybase profile");
                  } else {
                    setError("");
                    setKeybaseHandle(`https://keybase.io/${d.username}`);
                  }
                } catch {
                  setError("Keybase validation failed");
                }
              }}
            />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-900 dark:text-white">
              Shipping Policy
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  checked={mode === "FLAT"}
                  onChange={() => setMode("FLAT")}
                />
                <span>Flat per recipient</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  checked={mode === "REGION_BASED"}
                  onChange={() => setMode("REGION_BASED")}
                />
                <span>Region-based</span>
              </label>
            </div>
            {mode === "FLAT" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Flat fee ({currency})
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-2 rounded border dark:border-gray-600 dark:text-white">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                      value={String(flatFeeSats)}
                      onChange={(e) =>
                        setFlatFeeSats(
                          parseInt(
                            (e.target.value || "").replace(/[^0-9]/g, "") || "0"
                          )
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Ship to countries
                  </label>
                  <div className="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-300">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCountries.US}
                        onChange={(e) =>
                          setSelectedCountries({
                            ...selectedCountries,
                            US: e.target.checked,
                          })
                        }
                      />
                      <span>United States (NA)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCountries.AU}
                        onChange={(e) =>
                          setSelectedCountries({
                            ...selectedCountries,
                            AU: e.target.checked,
                          })
                        }
                      />
                      <span>Australia (OC)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCountries.NZ}
                        onChange={(e) =>
                          setSelectedCountries({
                            ...selectedCountries,
                            NZ: e.target.checked,
                          })
                        }
                      />
                      <span>New Zealand (OC)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            {mode === "REGION_BASED" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Select countries
                  </label>
                  <div className="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-300">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCountries.US}
                        onChange={(e) =>
                          setSelectedCountries({
                            ...selectedCountries,
                            US: e.target.checked,
                          })
                        }
                      />
                      <span>United States (NA)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCountries.AU}
                        onChange={(e) =>
                          setSelectedCountries({
                            ...selectedCountries,
                            AU: e.target.checked,
                          })
                        }
                      />
                      <span>Australia (OC)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCountries.NZ}
                        onChange={(e) =>
                          setSelectedCountries({
                            ...selectedCountries,
                            NZ: e.target.checked,
                          })
                        }
                      />
                      <span>New Zealand (OC)</span>
                    </label>
                  </div>
                </div>
                {(["US", "AU", "NZ"] as CountryKey[]).map(
                  (ck) =>
                    selectedCountries[ck] && (
                      <div key={ck} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                            {ck === "US"
                              ? "United States"
                              : ck === "AU"
                              ? "Australia"
                              : "New Zealand"}
                          </div>
                          <label className="text-sm flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={usePerState[ck]}
                              onChange={(e) =>
                                setUsePerState({
                                  ...usePerState,
                                  [ck]: e.target.checked,
                                })
                              }
                            />
                            <span>Set per-state fees</span>
                          </label>
                        </div>
                        {!usePerState[ck] && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                              Base fee for entire country
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded border dark:border-gray-600 dark:text-white">
                                $
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                                value={String(countrySingleFee[ck])}
                                onChange={(e) =>
                                  setCountrySingleFee({
                                    ...countrySingleFee,
                                    [ck]: parseInt(
                                      (e.target.value || "").replace(
                                        /[^0-9]/g,
                                        ""
                                      ) || "0"
                                    ),
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                        {usePerState[ck] && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                            {(ck === "US"
                              ? US_STATES
                              : ck === "AU"
                              ? AU_STATES
                              : NZ_REGIONS
                            ).map((name) => (
                              <div
                                key={name}
                                className="flex items-center justify-between space-x-2"
                              >
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                  {name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="px-1 py-0.5 rounded border dark:border-gray-600 dark:text-white">
                                    $
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="w-28 px-2 py-1 rounded border dark:bg-gray-700 dark:text-white text-right"
                                    placeholder="0"
                                    value={String(
                                      (perStateFees[ck] || {})[name] || 0
                                    )}
                                    onChange={(e) =>
                                      setPerStateFees({
                                        ...perStateFees,
                                        [ck]: {
                                          ...(perStateFees[ck] || {}),
                                          [name]: parseInt(
                                            (e.target.value || "").replace(
                                              /[^0-9]/g,
                                              ""
                                            ) || "0"
                                          ),
                                        },
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                )}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="font-medium text-gray-900 dark:text-white">
              Materials & Add-ons
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Sleeve Lite price ({currency})
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-2 rounded border dark:border-gray-600 dark:text-white">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                    value={String(sleeveLitePrice)}
                    onChange={(e) =>
                      setSleeveLitePrice(
                        parseInt(
                          (e.target.value || "").replace(/[^0-9]/g, "") || "0"
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Sleeve Premium price ({currency})
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-2 rounded border dark:border-gray-600 dark:text-white">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                    value={String(sleevePremiumPrice)}
                    onChange={(e) =>
                      setSleevePremiumPrice(
                        parseInt(
                          (e.target.value || "").replace(/[^0-9]/g, "") || "0"
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Blank plate price ({currency})
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-2 rounded border dark:border-gray-600 dark:text-white">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                    value={String(blankPlatePrice)}
                    onChange={(e) =>
                      setBlankPlatePrice(
                        parseInt(
                          (e.target.value || "").replace(/[^0-9]/g, "") || "0"
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Seed picker card price ({currency})
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-2 rounded border dark:border-gray-600 dark:text-white">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                    value={String(seedPickerCardPrice)}
                    onChange={(e) =>
                      setSeedPickerCardPrice(
                        parseInt(
                          (e.target.value || "").replace(/[^0-9]/g, "") || "0"
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Entropia pill price ({currency})
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-2 rounded border dark:border-gray-600 dark:text-white">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                    value={String(entropiaPillPrice)}
                    onChange={(e) =>
                      setEntropiaPillPrice(
                        parseInt(
                          (e.target.value || "").replace(/[^0-9]/g, "") || "0"
                        )
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                if (!providerId) return;
                setSaving(true);
                setError("");
                setSuccess("");
                try {
                  // Validate keybase before saving
                  if (!keybaseHandle) {
                    throw new Error("Keybase profile is required");
                  }
                  const kv = await fetch("/api/providers/validate-keybase", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ keybase: keybaseHandle }),
                  });
                  const kd = await kv.json();
                  if (!kv.ok || !kd.isValid) {
                    throw new Error(kd.error || "Invalid Keybase profile");
                  }
                  const normalizedKeybase = `https://keybase.io/${kd.username}`;
                  const satsPerUsdEnv =
                    process.env.NEXT_PUBLIC_SATS_PER_USD ||
                    process.env.SATS_PER_USD;
                  const satsPerUsd = satsPerUsdEnv
                    ? Number(satsPerUsdEnv)
                    : 5000;
                  const usdPer = (cur: string) => {
                    if (cur === "USD") return 1;
                    const aud = Number(
                      process.env.NEXT_PUBLIC_USD_PER_AUD ||
                        process.env.USD_PER_AUD ||
                        0.66
                    );
                    const nzd = Number(
                      process.env.NEXT_PUBLIC_USD_PER_NZD ||
                        process.env.USD_PER_NZD ||
                        0.6
                    );
                    return cur === "AUD" ? aud : cur === "NZD" ? nzd : 1;
                  };
                  const toUsd = (v: number) => Math.round(v * usdPer(currency));
                  const toSatsFromUsd = (usd: number) =>
                    Math.round(usd * (satsPerUsd || 1));

                  // Build materials catalog with priceUsd for server-side conversion
                  const materialsCatalogForSave = {
                    sleeves: [
                      ...(sleeveLitePrice > 0
                        ? [
                            {
                              sku: "SLV-LITE",
                              name: "Sleeve Lite",
                              description: "standard mailer",
                              priceUsd: toUsd(sleeveLitePrice),
                              shipUnits: 0.1,
                            },
                          ]
                        : []),
                      ...(sleevePremiumPrice > 0
                        ? [
                            {
                              sku: "SLV-PREMIUM",
                              name: "Sleeve Premium",
                              description: "tamper-evident",
                              priceUsd: toUsd(sleevePremiumPrice),
                              shipUnits: 0.1,
                            },
                          ]
                        : []),
                    ],
                    blankPlates: [
                      ...(blankPlatePrice > 0
                        ? [
                            {
                              sku: "PLT-SS-STEEL",
                              name: "Steel Plate",
                              description: "316L",
                              priceUsd: toUsd(blankPlatePrice),
                              shipUnits: 1,
                            },
                          ]
                        : []),
                    ],
                    seedPickerCards: [
                      ...(seedPickerCardPrice > 0
                        ? [
                            {
                              sku: "ACC-SEEDPICK",
                              name: "Seed Picker Card",
                              description: "character picker",
                              priceUsd: toUsd(seedPickerCardPrice),
                              shipUnits: 0.2,
                            },
                          ]
                        : []),
                    ],
                    entropiaPills: [
                      ...(entropiaPillPrice > 0
                        ? [
                            {
                              sku: "ACC-ENTROPIA",
                              name: "Entropia Pill",
                              description: "entropy aid",
                              priceUsd: toUsd(entropiaPillPrice),
                              shipUnits: 2,
                            },
                          ]
                        : []),
                    ],
                  };

                  // Build shipping policy in sats for storage
                  let shippingPolicyForSave: any;
                  if (mode === "FLAT") {
                    const shipsTo: any[] = [];
                    if (selectedCountries.US)
                      shipsTo.push({
                        continent: "NA",
                        regionCode: "US",
                        regionName: "United States",
                      });
                    if (selectedCountries.AU)
                      shipsTo.push({
                        continent: "OC",
                        regionCode: "AU",
                        regionName: "Australia",
                      });
                    if (selectedCountries.NZ)
                      shipsTo.push({
                        continent: "OC",
                        regionCode: "NZ",
                        regionName: "New Zealand",
                      });
                    const flatUsd = toUsd(flatFeeSats);
                    shippingPolicyForSave = {
                      mode: "FLAT",
                      flatFeeSats: toSatsFromUsd(flatUsd),
                      shipsTo,
                    };
                  } else {
                    const regions: any[] = [];
                    const pushCountry = (ck: CountryKey) => {
                      const continent = ck === "US" ? "NA" : "OC";
                      if (!usePerState[ck]) {
                        const usd = toUsd(countrySingleFee[ck] || 0);
                        if (selectedCountries[ck] && usd > 0) {
                          regions.push({
                            continent,
                            regionCode: ck,
                            regionName:
                              ck === "US"
                                ? "United States"
                                : ck === "AU"
                                ? "Australia"
                                : "New Zealand",
                            baseFeeSats: toSatsFromUsd(usd),
                          });
                        }
                      } else {
                        const list =
                          ck === "US"
                            ? US_STATES
                            : ck === "AU"
                            ? AU_STATES
                            : NZ_REGIONS;
                        for (const name of list) {
                          const raw = (perStateFees[ck] || {})[name] || 0;
                          if (raw > 0) {
                            const usd = toUsd(raw);
                            regions.push({
                              continent,
                              regionCode: `${ck}-${name}`,
                              regionName: name,
                              baseFeeSats: toSatsFromUsd(usd),
                            });
                          }
                        }
                      }
                    };
                    if (selectedCountries.US) pushCountry("US");
                    if (selectedCountries.AU) pushCountry("AU");
                    if (selectedCountries.NZ) pushCountry("NZ");
                    shippingPolicyForSave = { mode: "REGION_BASED", regions };
                  }

                  const res = await fetch("/api/providers/config", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      providerId,
                      username,
                      keybaseHandle: normalizedKeybase,
                      shippingPolicyDefault: shippingPolicyForSave,
                      materialsCatalog: materialsCatalogForSave,
                    }),
                  });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.error || "Failed to save");
                  }
                  setSuccess("Saved");
                  router.push("/provider-dashboard");
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setSaving(false);
                }
              }}
              loading={saving}
              disabled={saving}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
