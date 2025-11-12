import moment from "moment";

export function dateParser(date: string | undefined): number {
  if (!date) return Date.now();

  // Handle "Сегодня" or "Вчера"
  if (date.startsWith("Сегодня") || date.startsWith("Вчера")) {
    const [day, time = "00:00"] = date.split(" в ");
    const [hours = 0, minutes = 0] = time.split(":").map(Number);

    const now = new Date();

    if (day === "Сегодня") {
      now.setHours(hours, minutes, 0, 0);
      return now.getTime();
    }

    if (day === "Вчера") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(hours, minutes, 0, 0);
      return yesterday.getTime();
    }
  }

  // Parse formatted dates like "10 ноября 2025"
  const parsed = moment(date, "LL", "ru", true).toDate();
  return parsed.getTime() || Date.now();
}
