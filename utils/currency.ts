// Le backend renvoie 'XOF' (code ISO) ; on affiche le libellé usuel 'FCFA'.
export function displayCurrency(currency: string): string {
  return currency === 'XOF' ? 'FCFA' : currency;
}
