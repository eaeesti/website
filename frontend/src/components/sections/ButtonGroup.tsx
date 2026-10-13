import type { StrapiButton } from "@/types/generated/strapi";
import { classes } from "@/utils/react";
import Button, { type ButtonSize } from "../elements/Button";

export default function ButtonGroup({
  buttons,
  size,
  className,
}: {
  buttons: StrapiButton[] | null | undefined;
  /** Overrides the buttons' own size, for sections that want big buttons. */
  size?: ButtonSize;
  className?: string;
}) {
  if (!buttons?.length) return null;
  return (
    <div className={classes("flex flex-wrap items-center gap-4", className)}>
      {buttons.map((button) => (
        <Button
          key={button.id}
          text={button.text}
          href={button.href}
          type={button.type}
          size={size ?? button.size}
          arrow={button.arrow}
          newTab={button.newTab}
          plausibleEvent={button.plausibleEvent}
        />
      ))}
    </div>
  );
}
