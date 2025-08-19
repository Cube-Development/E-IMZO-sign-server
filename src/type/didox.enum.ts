export enum ENUM_DOCUMENT_STATUS {
  CREATED = 0,
  SIGNAED_SELF = 1,
  SIGNED_PARTY = 2,
  SIGNED = 3,
  REJECTED = 4,
  DELETED = 5,
  DRAFT_DELETED = 55,
  WAIT_FOR_AGENT_SIGN = 6,
  SIGNED_BY_AGENT = 8,
  NOT_VALID = 40,
  PARTNER_WAIT_FOR_AGENT_SIGN = 60,
  CONSIGNOR_SENT = 110,
  CONSIGNOR_CANCELED = 120,
  RESPONSIBLE_PERSON_REJECTED = 130,
  RESPONSIBLE_PERSON_ACCEPTED = 140,
  RESPONSIBLE_PERSON_TILL_RETURNED = 150,
  RESPONSIBLE_PERSON_GIVEN = 160,
  RESPONSIBLE_PERSON_RETURNED = 190,
}

export enum ENUM_DOCUMENT_TYPE {
  INVOICE_UNUSED = "001", // Счёт фактура [Не используется]
  INVOICE_NO_ACT = "002", // Счёт фактура без акта
  INVOICE_PHARM = "008", // Счет-фактура (ФАРМ)
  WAYBILL = "041", // ТТН (Товарно-транспортная накладная)
  WORK_ACT = "005", // Акт выполненых работ
  POWER_OF_ATTORNEY = "006", // Доверенность
  CONTRACT_GNK = "007", // Договор (ГНК)
  CUSTOM_DOCUMENT = "000", // Произвольный документ
  RECONCILIATION_ACT = "052", // Акт сверки
  ACCEPTANCE_ACT = "054", // Акт приема передач
  MULTILATERAL_CUSTOM_DOCUMENT = "010", // Многосторонний произвольный документ
  FOUNDERS_PROTOCOL = "075", // Протокол собрания учредителей
}

export const DOCUMENT_TYPES: Record<string, string> = {
  "001": "Счёт фактура [Не используется]",
  "002": "Счёт фактура без акта",
  "008": "Счет-фактура (ФАРМ)",
  "041": "ТТН (Товарно-транспортная накладная)",
  "005": "Акт выполненных работ",
  "006": "Доверенность",
  "007": "Договор (ГНК)",
  "000": "Произвольный документ",
  "052": "Акт сверки",
  "054": "Акт приема-передачи",
  "010": "Многосторонний произвольный документ",
  "075": "Протокол собрания учредителей"
} as const;