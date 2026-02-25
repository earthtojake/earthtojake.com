import type { CSSProperties, PropsWithChildren } from "react";

type ViewportContainerProps = PropsWithChildren<{
  className?: string;
  stackOrder?: number;
}>;

export function ViewportContainer({
  className,
  stackOrder,
  children,
}: ViewportContainerProps) {
  const rootClassName = ["w-full max-w-full", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const rootStyle: CSSProperties = {};
  if (typeof stackOrder === "number") {
    rootStyle.zIndex = stackOrder;
  }

  return (
    <div
      className={rootClassName}
      style={Object.keys(rootStyle).length > 0 ? rootStyle : undefined}
    >
      {children}
    </div>
  );
}
