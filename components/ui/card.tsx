import { HTMLAttributes } from "react";

type ICardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: ICardProps) {
  return (
    <div
      className={`bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: ICardProps) {
  return (
    <div className={`p-4 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }: ICardProps) {
  return (
    <div className={`p-3.5 ${className}`} {...props}>
      {children}
    </div>
  );
}
