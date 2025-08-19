import {
  ENUM_DOCUMENT_STATUS,
  ENUM_DOCUMENT_TYPE,
} from "./didox.enum";

export interface IGetDocumentEDORequest {
  owner?: 0 | 1; // 1 - исходящие, 0 - входящие
  page?: number; // 1..∞
  limit?: number; // 1..100

  // Даты (в формате yyyy-mm-dd), необязательные
  dateFromCreated?: string;
  dateToCreated?: string;
  dateFromUpdated?: string;
  dateToUpdated?: string;
  signDateFrom?: string;
  signDateTo?: string;

  doctype?: ENUM_DOCUMENT_TYPE; // Тип документа (например, "001", "005" и т.п.)
  name?: string; // Номер документа
  sum?: number; // Сумма документа

  docDateFromCreated?: string;
  docDateToCreated?: string;

  contractName?: string; // Номер договора
  contractDate?: string; // Дата договора (yyyy-mm-dd)

  hasCommittent?: 0 | 1; // Комиссионерский документ
  hasLgota?: 0 | 1; // Документ с льготой
  hasMarks?: 0 | 1; // Документ с маркировкой
  oneSide?: 0 | 1; // Односторонний документ

  status?: ENUM_DOCUMENT_STATUS | string; // Статус документа
}

export interface IGetDocumentEDOResponse {
  data: IDocumentEDO[];
  total: number;
  next_page_url: string | null;
  source: string;
  isLast?: boolean; // Опционально, для указания последней страницы
}

export interface IDocumentEDO {
  pid: number;
  doc_id: string;
  usersTaxId: string;
  name: string;
  doc_date: string;
  doc_status: ENUM_DOCUMENT_STATUS;
  doctype: ENUM_DOCUMENT_TYPE;
  contract_number: string;
  contract_date: string;
  owner: 0 | 1;
  agent: number;
  partnerTin: string;
  partnerAllowProposals: number;
  partnerCompany: string;
  partnerPhone: string;
  total_sum: number;
  total_delivery_sum: number;
  total_vat_sum: number;
  total_delivery_sum_with_vat: number;
  oneside: number;
  has_committent: number;
  has_vat: boolean;
  has_lgota: number;
  has_marks: number;
  roaming_id: string;
  signed: string;
  updated: string;
  updated_date: string;
  updated_unix: number;
  created: string;
  created_unix: number;
  partiesID: string;
  lgota_codes: string;
  factura_type: number;
  sellerAccount: string;
  status_comment: any;
  internal_status: any;
  internal_comment: any;
  internal_status_alarm: any;
  mark_codes: any;
  branch_num: any;
}


export interface IGetTokenRequest {
  PNFL: number | string;
  lang: "ru" | "uz";
  signature?: string;
  password?: string;
}

export interface IGetTokenResponse {
  token: string;
  related_companies?: string[] | null;
  related_branches?: string[] | null;
  taxId?: string[];
}