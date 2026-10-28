// Who's this? (AT Network first, Jesse 2026-10-28): browser side. The picked
// name lives on the device, under the same key Messages already used for the
// sender's name, and goes with every tick and upload as a header. The server
// keeps it only for products that list the person (lib/activityStore.ts).

export const PERSON_HEADER = "x-portal-person";
export const personKey = (portalToken: string) => `pjcName:${portalToken}`;

export function readPerson(portalToken: string | undefined): string {
  if (!portalToken) return "";
  try {
    return window.localStorage.getItem(personKey(portalToken)) ?? "";
  } catch {
    return "";
  }
}

export function savePerson(portalToken: string, name: string) {
  try { window.localStorage.setItem(personKey(portalToken), name); } catch {}
  window.dispatchEvent(new CustomEvent("pjc:person", { detail: name }));
}

/** The header to send with a portal request: empty when no one has been picked. */
export function personHeaders(portalToken: string | undefined): Record<string, string> {
  const name = readPerson(portalToken);
  return name ? { [PERSON_HEADER]: encodeURIComponent(name) } : {};
}

/** "29 Oct, 2:14 pm" in the viewer's own time. */
export function stampTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}
