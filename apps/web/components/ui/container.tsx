import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}

const sizeClasses = {
  default: "w-full px-[15px] 2xl:w-[1792px] 2xl:px-0",
  narrow: "max-w-4xl px-[15px] 2xl:px-0",
  wide: "w-full px-[15px] 2xl:w-[1792px] 2xl:px-0",
};

export default function Container({
  children,
  className,
  size = "default",
}: ContainerProps) {
  return (
    <div className={cn("mx-auto", sizeClasses[size], className)}>
      {children}
    </div>
  );
}
