let _token: string | null = null;

export function setManageToken(token: string): void {
  _token = token;
}

export function consumeManageToken(): string | null {
  const t = _token;
  _token = null;
  return t;
}
