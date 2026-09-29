type BillingInterval = {
  unit: "month" | "week" | "day";
  count: number;
};

export type CurrencyTotal = {
  currency: string;
  amount: number;
};

export type ExpectedCharge = {
  subscription: Subscription;
  date: Date;
  amount: number;
  currency: string;
};

export type DailyExpectedTotal = {
  date: Date;
  label: string;
  amount: number;
};

export function getBillingInterval(value?: string): BillingInterval {
  const normalized = value?.trim().toLowerCase() ?? "monthly";
  const count = Number.parseInt(normalized.match(/\d+/)?.[0] ?? "1", 10);

  if (normalized.includes("quarter")) return { unit: "month", count: 3 };
  if (normalized.includes("year") || normalized.includes("annual")) {
    return { unit: "month", count: 12 };
  }
  if (normalized.includes("week")) {
    return { unit: "week", count: Math.max(1, count) };
  }
  if (normalized.includes("day")) {
    return { unit: "day", count: Math.max(1, count) };
  }
  if (normalized.includes("6 month") || normalized.includes("semiannual")) {
    return { unit: "month", count: 6 };
  }
  if (normalized.includes("2 month") || normalized.includes("bimonth")) {
    return { unit: "month", count: 2 };
  }

  return { unit: "month", count: Math.max(1, count) };
}

export function isSubscriptionActive(
  subscription: Subscription,
  asOf = new Date(),
): boolean {
  const status = subscription.status?.trim().toLowerCase();
  if (["paused", "expired", "inactive"].includes(status ?? "")) return false;
  if (["cancelled", "canceled"].includes(status ?? "")) {
    if (!subscription.cancellationDate) return false;
    const cancellationDate = parseDate(subscription.cancellationDate);
    return (
      Number.isFinite(cancellationDate.getTime()) &&
      startOfLocalDay(cancellationDate) > startOfLocalDay(asOf)
    );
  }
  if (subscription.cancellationDate) {
    const cancellationDate = parseDate(subscription.cancellationDate);
    if (
      Number.isFinite(cancellationDate.getTime()) &&
      startOfLocalDay(cancellationDate) <= startOfLocalDay(asOf)
    ) {
      return false;
    }
  }
  return true;
}

function isValidPrice(subscription: Subscription): boolean {
  return Number.isFinite(subscription.price) && subscription.price >= 0;
}

function getCurrency(subscription: Subscription): string {
  return subscription.currency?.trim().toUpperCase() || "USD";
}

function parseDate(value: string): Date {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }
  return new Date(value);
}

function localDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

export function getLocalCalendarDayDifference(date: Date, from: Date): number {
  return localDayNumber(date) - localDayNumber(from);
}

export function getMonthlyRecurringTotals(
  subscriptions: Subscription[],
  asOf = new Date(),
): CurrencyTotal[] {
  const totals = new Map<string, number>();

  for (const subscription of subscriptions) {
    const startDate = subscription.startDate
      ? parseDate(subscription.startDate)
      : null;
    if (
      !isSubscriptionActive(subscription, asOf) ||
      !isValidPrice(subscription) ||
      (startDate &&
        (!Number.isFinite(startDate.getTime()) ||
          startOfLocalDay(startDate) > startOfLocalDay(asOf)))
    ) {
      continue;
    }

    const interval = getBillingInterval(
      subscription.billing || subscription.frequency,
    );
    const monthsPerCycle =
      interval.unit === "month"
        ? interval.count
        : interval.unit === "week"
          ? (interval.count * 12) / 52
          : (interval.count * 12) / 365.2425;
    const currency = getCurrency(subscription);
    totals.set(
      currency,
      (totals.get(currency) ?? 0) + subscription.price / monthsPerCycle,
    );
  }

  return [...totals].map(([currency, amount]) => ({ currency, amount }));
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getOccurrenceDate(
  anchor: Date,
  interval: BillingInterval,
  cycle: number,
): Date {
  if (interval.unit === "month") {
    const monthStart = new Date(
      anchor.getFullYear(),
      anchor.getMonth() + interval.count * cycle,
      1,
      anchor.getHours(),
      anchor.getMinutes(),
      anchor.getSeconds(),
      anchor.getMilliseconds(),
    );
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();
    monthStart.setDate(Math.min(anchor.getDate(), daysInMonth));
    return monthStart;
  }

  const occurrence = new Date(anchor);
  const dayCount = interval.count * (interval.unit === "week" ? 7 : 1) * cycle;
  occurrence.setDate(occurrence.getDate() + dayCount);
  return occurrence;
}

function getFirstCycleAtOrAfter(
  anchor: Date,
  interval: BillingInterval,
  start: Date,
): number {
  let cycle = 0;

  if (interval.unit === "month") {
    const monthDifference =
      (start.getFullYear() - anchor.getFullYear()) * 12 +
      start.getMonth() -
      anchor.getMonth();
    cycle = Math.floor(monthDifference / interval.count);
  } else {
    const daysPerCycle = interval.count * (interval.unit === "week" ? 7 : 1);
    const dayDifference = Math.floor(
      localDayNumber(startOfLocalDay(start)) -
        localDayNumber(startOfLocalDay(anchor)),
    );
    cycle = Math.floor(dayDifference / daysPerCycle);
  }

  while (getOccurrenceDate(anchor, interval, cycle) < start) cycle += 1;
  while (getOccurrenceDate(anchor, interval, cycle - 1) >= start) cycle -= 1;
  return cycle;
}

export function getNextExpectedCharge(
  subscription: Subscription,
  from = new Date(),
): ExpectedCharge | null {
  if (
    !isSubscriptionActive(subscription, from) ||
    !isValidPrice(subscription)
  ) {
    return null;
  }

  const anchorValue = subscription.renewalDate || subscription.startDate;
  if (!anchorValue) return null;

  const anchor = parseDate(anchorValue);
  if (!Number.isFinite(anchor.getTime())) return null;

  const interval = getBillingInterval(
    subscription.billing || subscription.frequency,
  );
  let cycle = getFirstCycleAtOrAfter(anchor, interval, from);
  let occurrence = getOccurrenceDate(anchor, interval, cycle);

  if (subscription.startDate) {
    const startDate = parseDate(subscription.startDate);
    if (!Number.isFinite(startDate.getTime())) return null;
    if (occurrence < startDate) {
      cycle = getFirstCycleAtOrAfter(anchor, interval, startDate);
      occurrence = getOccurrenceDate(anchor, interval, cycle);
    }
  }

  if (subscription.cancellationDate) {
    const cancellationDate = startOfLocalDay(
      parseDate(subscription.cancellationDate),
    );
    if (
      !Number.isFinite(cancellationDate.getTime()) ||
      occurrence >= cancellationDate
    ) {
      return null;
    }
  }

  while (occurrence < from) {
    cycle += 1;
    occurrence = getOccurrenceDate(anchor, interval, cycle);
  }

  return {
    subscription,
    date: occurrence,
    amount: subscription.price,
    currency: getCurrency(subscription),
  };
}

export function getExpectedCharges(
  subscriptions: Subscription[],
  start: Date,
  end: Date,
  now = new Date(),
): ExpectedCharge[] {
  const charges: ExpectedCharge[] = [];
  const periodStart = startOfLocalDay(start);

  for (const subscription of subscriptions) {
    if (!isValidPrice(subscription)) continue;

    const anchorValue = subscription.renewalDate || subscription.startDate;
    if (!anchorValue) continue;

    const anchor = parseDate(anchorValue);
    if (!Number.isFinite(anchor.getTime())) continue;

    const startDate = subscription.startDate
      ? parseDate(subscription.startDate)
      : null;
    if (startDate && !Number.isFinite(startDate.getTime())) continue;

    const status = subscription.status?.trim().toLowerCase();
    const inactiveFrom = ["paused", "expired", "inactive"].includes(
      status ?? "",
    )
      ? new Date(0)
      : ["cancelled", "canceled"].includes(status ?? "")
        ? subscription.cancellationDate
          ? startOfLocalDay(parseDate(subscription.cancellationDate))
          : new Date(0)
        : subscription.cancellationDate
          ? startOfLocalDay(parseDate(subscription.cancellationDate))
          : null;
    if (inactiveFrom && !Number.isFinite(inactiveFrom.getTime())) {
      continue;
    }

    const interval = getBillingInterval(
      subscription.billing || subscription.frequency,
    );
    let cycle = getFirstCycleAtOrAfter(anchor, interval, periodStart);
    let occurrence = getOccurrenceDate(anchor, interval, cycle);

    while (occurrence < end) {
      if (
        (!startDate || occurrence >= startDate) &&
        (!inactiveFrom || occurrence < inactiveFrom)
      ) {
        charges.push({
          subscription,
          date: occurrence,
          amount: subscription.price,
          currency: getCurrency(subscription),
        });
      }

      cycle += 1;
      occurrence = getOccurrenceDate(anchor, interval, cycle);
    }
  }

  return charges.sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );
}

export function getExpectedTotalsByCurrency(
  charges: ExpectedCharge[],
): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const charge of charges) {
    totals.set(
      charge.currency,
      (totals.get(charge.currency) ?? 0) + charge.amount,
    );
  }
  return [...totals].map(([currency, amount]) => ({ currency, amount }));
}

export function getLocalMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
  };
}

export function getPreviousMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth() - 1, 1),
    end: new Date(date.getFullYear(), date.getMonth(), 1),
  };
}

export function getLocalWeekRange(date: Date): { start: Date; end: Date } {
  const start = startOfLocalDay(date);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function getDailyExpectedTotals(
  charges: ExpectedCharge[],
  start: Date,
): DailyExpectedTotal[] {
  const totals = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return {
      date,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" })
        .format(date)
        .slice(0, 3),
      amount: 0,
    };
  });

  for (const charge of charges) {
    const dayOffset =
      localDayNumber(startOfLocalDay(charge.date)) -
      localDayNumber(startOfLocalDay(start));
    if (dayOffset >= 0 && dayOffset < totals.length) {
      totals[dayOffset].amount += charge.amount;
    }
  }

  return totals;
}

export function getPercentageChange(
  current: number,
  previous: number,
): number | null {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}
