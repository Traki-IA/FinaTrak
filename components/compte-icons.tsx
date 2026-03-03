import { Landmark, Wallet, CreditCard, PiggyBank, Building2, Banknote } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  landmark: Landmark,
  wallet: Wallet,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  building: Building2,
  banknote: Banknote,
};

function CompteIcon({ icone, size = 16, strokeWidth = 1.8 }: { icone: string; size?: number; strokeWidth?: number }) {
  const Icon = ICON_MAP[icone] ?? Landmark;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}

export { ICON_MAP, CompteIcon };
