import { HTMLAttributes } from "react";

type ICardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: ICardProps) {
  return (
    <div
      className={`bg-white/[0.04] border border-white/[0.07] rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: ICardProps) {
  return (
    <div className={`p-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }: ICardProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
