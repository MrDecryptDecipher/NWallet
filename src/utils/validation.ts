export interface ValidationResults {
  [key: string]: string | undefined;
}

export function validateAddresses(addresses: string[]): string[] {
  return addresses.map(addr => addr.trim());
}

export function validateDApps(dapps: string[]): string[] {
  return dapps.map(dapp => dapp.trim());
}