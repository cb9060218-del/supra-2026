// Date parsing and attendance scheduling utility for SUPRA SAEINDIA 2026

export interface DateBreakdownItem {
  id: string;
  dateKey: string;
  displayLabel: string;
  shortLabel: string;
  description: string;
  count: number;
}

export const EVENT_DATES: { dateKey: string; displayLabel: string; shortLabel: string; description: string }[] = [
  { dateKey: "2026-08-31", displayLabel: "31 Aug 2026 (Mon)", shortLabel: "31 Aug", description: "Setup & Registration" },
  { dateKey: "2026-09-01", displayLabel: "1 Sep 2026 (Tue)", shortLabel: "1 Sep", description: "Technical Inspection / Scrutineering" },
  { dateKey: "2026-09-02", displayLabel: "2 Sep 2026 (Wed)", shortLabel: "2 Sep", description: "Static Events & Expo Opening" },
  { dateKey: "2026-09-03", displayLabel: "3 Sep 2026 (Thu)", shortLabel: "3 Sep", description: "Dynamic Events Day 1 / ACMA Visit" },
  { dateKey: "2026-09-04", displayLabel: "4 Sep 2026 (Fri)", shortLabel: "4 Sep", description: "Dynamic Events Day 2 / Autocross" },
  { dateKey: "2026-09-05", displayLabel: "5 Sep 2026 (Sat)", shortLabel: "5 Sep", description: "Endurance Race & Valedictory Ceremony" },
  { dateKey: "unspecified", displayLabel: "Need to check / Pending", shortLabel: "Need to check", description: "Unconfirmed attendance dates" },
];

/**
 * Checks if a guest is attending on a specific dateKey.
 */
export function isGuestAttendingOnDate(
  guestRemarks: string | null | undefined,
  arrivalDate: string | null | undefined,
  departureDate: string | null | undefined,
  targetDateKey: string
): boolean {
  if (!targetDateKey || targetDateKey === "all") return true;

  const text = (guestRemarks || "").toLowerCase().trim();

  const isKnownEventDate =
    text.includes("31 aug") ||
    text.includes("1 sep") ||
    text.includes("1–5 sep") ||
    text.includes("1-5 sep") ||
    text.includes("2 sep") ||
    text.includes("2–5 sep") ||
    text.includes("2-5 sep") ||
    text.includes("3 sep") ||
    text.includes("4 sep") ||
    text.includes("5 sep");

  if (targetDateKey === "unspecified") {
    if (!text || text === "-" || !isKnownEventDate || text.includes("need to check") || text.includes("pending") || text.includes("9 may")) {
      return true;
    }
    return false;
  }

  if (targetDateKey === "2026-08-31" || targetDateKey === "31 Aug") {
    return text.includes("31 aug") || text.includes("31st aug");
  }

  if (targetDateKey === "2026-09-01" || targetDateKey === "1 Sep") {
    return (
      text.includes("1–5 sep") ||
      text.includes("1-5 sep") ||
      text.includes("1 sep") ||
      text.includes("31 aug – 5 sep") ||
      text.includes("31 aug - 5 sep")
    );
  }

  if (targetDateKey === "2026-09-02" || targetDateKey === "2 Sep") {
    return (
      text.includes("2–5 sep") ||
      text.includes("2-5 sep") ||
      text.includes("1–5 sep") ||
      text.includes("1-5 sep") ||
      text.includes("2 sep") ||
      text.includes("31 aug – 5 sep") ||
      text.includes("31 aug - 5 sep")
    );
  }

  if (targetDateKey === "2026-09-03" || targetDateKey === "3 Sep") {
    return (
      text.includes("3 sep") ||
      text.includes("3rd sep") ||
      text.includes("2–5 sep") ||
      text.includes("2-5 sep") ||
      text.includes("1–5 sep") ||
      text.includes("1-5 sep") ||
      text.includes("31 aug – 5 sep") ||
      text.includes("31 aug - 5 sep")
    );
  }

  if (targetDateKey === "2026-09-04" || targetDateKey === "4 Sep") {
    return (
      text.includes("4 sep") ||
      text.includes("2–5 sep") ||
      text.includes("2-5 sep") ||
      text.includes("1–5 sep") ||
      text.includes("1-5 sep") ||
      text.includes("31 aug – 5 sep") ||
      text.includes("31 aug - 5 sep")
    );
  }

  if (targetDateKey === "2026-09-05" || targetDateKey === "5 Sep") {
    return (
      text.includes("5 sep") ||
      text.includes("5th sep") ||
      text.includes("2–5 sep") ||
      text.includes("2-5 sep") ||
      text.includes("1–5 sep") ||
      text.includes("1-5 sep") ||
      text.includes("31 aug – 5 sep") ||
      text.includes("31 aug - 5 sep")
    );
  }

  return false;
}

/**
 * Computes exact breakdown count of guests attending on each date.
 */
export function computeGuestDateBreakdown(
  guests: { remarks?: string | null; arrival_date?: string | null; departure_date?: string | null }[]
): DateBreakdownItem[] {
  return EVENT_DATES.map((d) => {
    const count = guests.filter((g) =>
      isGuestAttendingOnDate(g.remarks, g.arrival_date, g.departure_date, d.dateKey)
    ).length;

    return {
      id: d.dateKey,
      dateKey: d.dateKey,
      displayLabel: d.displayLabel,
      shortLabel: d.shortLabel,
      description: d.description,
      count,
    };
  });
}
