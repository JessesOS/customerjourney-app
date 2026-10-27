"use client";

import { useState } from "react";
import { AgreementAccept } from "@/app/components/portal/AgreementAccept";
import type { AgreementContent } from "@/lib/journeyTypes";

/** The signing page's form: the portal's accept form, posting to the signing API, asking for the position too. */
export function SigningPanel({ endpoint, agreement }: { endpoint: string; agreement: AgreementContent }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <AgreementAccept endpoint={endpoint} agreement={agreement} askPosition fullText onAccepted={() => setDone(true)} />
      {done && (
        <p className="sg-done" role="status">
          Signed. A copy is on its way to your inbox, and Jesse has been told. You can close this page.
        </p>
      )}
    </>
  );
}
