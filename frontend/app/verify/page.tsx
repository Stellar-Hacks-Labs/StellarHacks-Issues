import { VerifyForm } from "./verify-form";
import { Measure } from "../components/primitives";
import { keyId } from "../../lib/credentials/keys";

/**
 * Checking somebody else's credential, without having to trust us.
 *
 * A page on the issuer's own site is an odd place for that, and the design
 * answers the oddness head on: the signature check runs in the reader's
 * browser, with arithmetic and no request here, and everything about the claim
 * itself is presented as links to the chain rather than as our verdict. The
 * page can tell a reader whether the signer is us; it does not ask itself
 * whether it should be believed.
 *
 * Open to anybody. A credential is handed to a grant committee, an employer or
 * a delegate, and asking them to sign in before they can check it would make
 * the check a relationship with us instead of a fact about the chain.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Check a credential · StelHacks",
  description:
    "Paste a StelHacks builder credential to check its signature in your own browser, and follow its evidence to the chain.",
};

export default function Verify() {
  /* Read on the server, because it is read from the environment — the public
     half only. The page hands it to the form so a reader can see whether the
     credential was signed by this deployment's key or by somebody else's. */
  const ourKeyId = keyId();

  return (
    <main className="flex-1">
      <Measure className="py-10 sm:py-14">
        <p className="label text-[0.8125rem] tracking-[0.16em] text-ink-faint">Credentials</p>

        <h1 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)]">Check a credential</h1>

        <p className="mt-4 max-w-[42rem] text-ink-soft">
          A builder credential is signed JSON that cites the hackathon contract, the ranking and the
          transaction that paid it. Paste one below: the signature is checked here in your browser,
          and the links take you to the chain, which is the part that does not depend on us.
        </p>

        {ourKeyId !== null && (
          <p className="mt-4 text-[0.9375rem] text-ink-soft">
            This deployment signs with{" "}
            <span className="tabular break-all">{ourKeyId}</span>. A credential naming any other key
            was signed by somebody else, however valid its signature is.
          </p>
        )}

        <div className="mt-10">
          <VerifyForm ourKeyId={ourKeyId} />
        </div>
      </Measure>
    </main>
  );
}
