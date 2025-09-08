import { ParsedCertificateInfo } from "../type";

export const parseCertificateAlias = (alias: string): ParsedCertificateInfo => {
  const parts = alias.split(",");
  const info: Record<string, string> = {};

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      info[key.trim()] = value.trim();
    }
  });

  // Извлекаем ПИНФЛ из поля 1.2.860.3.16.1.2
  const pnfl = info["1.2.860.3.16.1.2"] || "No data";
  const uid = info["1.2.860.3.16.1.1"] || info.uid || null;

  // Форматируем дату - берем только день.месяц.год
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "No date") return "No date";
    // Формат: 2027.02.05 12:49:11 -> 05.02.2027
    const datePart = dateStr.split(" ")[0]; // Берем только дату без времени
    if (datePart) {
      const [year, month, day] = datePart.split(".");
      return `${day}.${month}.${year}`;
    }
    return dateStr;
  };

  return {
    cn: info.cn || "No data",
    name: info.name || "No data",
    surname: info.surname || "No data",
    location: info.l || "No data",
    region: info.st || "No data",
    organization: info.o || "",
    pnfl: pnfl,
    uid: uid,
    validFrom: formatDate(info.validfrom),
    validTo: formatDate(info.validto),
  };
};
