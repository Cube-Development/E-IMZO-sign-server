export interface Certificate {
  disk: string;
  path: string;
  name: string;
  alias: string;
}

export interface CreateSignatureResponse {
  pkcs7_64: string;
  signature_hex: string;
}

export interface WebSocketMessage {
  plugin?: string;
  name: string;
  arguments?: any[];
}

export interface WebSocketResponse {
  success: boolean;
  reason?: string;
  keyId?: string;
  pkcs7_64?: string;
  signature_hex?: string;
  certificates?: Certificate[];
}

export interface ParsedCertificateInfo {
  cn: string;
  name: string;
  surname: string;
  location: string;
  region: string;
  organization: string;
  pnfl: string;
  uid: string | null;
  validFrom: string;
  validTo: string;
}