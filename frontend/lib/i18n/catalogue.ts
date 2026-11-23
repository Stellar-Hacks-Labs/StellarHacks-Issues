/**
 * Load message catalogues from disk.
 *
 * Each namespace is a separate JSON file per locale. Keys are dot-separated
 * paths like "hero.title" and values are the translated strings.
 */

import type { Locale } from "./config";
import en_shell from "../../messages/en/shell.json";
import en_landing from "../../messages/en/landing.json";
import en_listing from "../../messages/en/listing.json";
import en_account from "../../messages/en/account.json";
import en_how_it_works from "../../messages/en/how-it-works.json";
import en_hackathon from "../../messages/en/hackathon.json";
import en_participate from "../../messages/en/participate.json";
import en_vote from "../../messages/en/vote.json";
import en_reveal from "../../messages/en/reveal.json";
import en_proof from "../../messages/en/proof.json";
import en_judge from "../../messages/en/judge.json";
import en_manage from "../../messages/en/manage.json";
import en_glossary from "../../messages/en/glossary.json";
import en_errors from "../../messages/en/errors.json";

import tr_shell from "../../messages/tr/shell.json";
import tr_landing from "../../messages/tr/landing.json";
import tr_listing from "../../messages/tr/listing.json";
import tr_account from "../../messages/tr/account.json";
import tr_how_it_works from "../../messages/tr/how-it-works.json";
import tr_hackathon from "../../messages/tr/hackathon.json";
import tr_participate from "../../messages/tr/participate.json";
import tr_vote from "../../messages/tr/vote.json";
import tr_reveal from "../../messages/tr/reveal.json";
import tr_proof from "../../messages/tr/proof.json";
import tr_judge from "../../messages/tr/judge.json";
import tr_manage from "../../messages/tr/manage.json";
import tr_glossary from "../../messages/tr/glossary.json";
import tr_errors from "../../messages/tr/errors.json";

type Messages = Record<string, string>;

interface Catalogue {
  shell: Messages;
  landing: Messages;
  listing: Messages;
  account: Messages;
  "how-it-works": Messages;
  hackathon: Messages;
  participate: Messages;
  vote: Messages;
  reveal: Messages;
  proof: Messages;
  judge: Messages;
  manage: Messages;
  glossary: Messages;
  errors: Messages;
}

const catalogues: Record<Locale, Catalogue> = {
  en: {
    shell: en_shell,
    landing: en_landing,
    listing: en_listing,
    account: en_account,
    "how-it-works": en_how_it_works,
    hackathon: en_hackathon,
    participate: en_participate,
    vote: en_vote,
    reveal: en_reveal,
    proof: en_proof,
    judge: en_judge,
    manage: en_manage,
    glossary: en_glossary,
    errors: en_errors,
  },
  tr: {
    shell: tr_shell,
    landing: tr_landing,
    listing: tr_listing,
    account: tr_account,
    "how-it-works": tr_how_it_works,
    hackathon: tr_hackathon,
    participate: tr_participate,
    vote: tr_vote,
    reveal: tr_reveal,
    proof: tr_proof,
    judge: tr_judge,
    manage: tr_manage,
    glossary: tr_glossary,
    errors: tr_errors,
  },
};

export type Namespace = keyof Catalogue;

/**
 * Load a namespace's messages for a locale.
 *
 * Returns the messages object for the namespace, or throws if the namespace
 * does not exist. Missing keys are caught by the parity test, not here.
 */
export function loadMessages(locale: Locale, namespace: Namespace): Messages {
  return catalogues[locale][namespace];
}
