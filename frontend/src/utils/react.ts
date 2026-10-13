export function classes(
  ...args: (string | false | null | undefined)[]
): string {
  return args.filter(Boolean).join(" ");
}
