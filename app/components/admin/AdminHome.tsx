"use client";

import { useEffect } from "react";
import { useMe } from "@/app/components/admin/teamClient";

/** /admin: the Board when the team board is on, otherwise the Clients page. */
export function AdminHome() {
  const { state } = useMe();
  useEffect(() => {
    if (state === "ok") window.location.replace("/admin/board");
    else if (state === "off" || state === "locked") window.location.replace("/admin/clients");
  }, [state]);
  return null;
}
