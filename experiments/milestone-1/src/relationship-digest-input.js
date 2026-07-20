import {
  compareBytes,
  concatBytes,
  requireBytes,
  uint32be,
  utf8,
} from "./bytes.js";
import {
  MAX_PUBLIC_CONTACT_BYTES,
  RELATIONSHIP_DIGEST_LABEL,
  RELATIONSHIP_DIGEST_NOTICE,
} from "./constants.js";

const domainTag = utf8(
  `${RELATIONSHIP_DIGEST_LABEL}\u0000${RELATIONSHIP_DIGEST_NOTICE}\u0000`,
);

function validateContact(value, name) {
  const contact = requireBytes(value, name);
  if (contact.length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  if (contact.length > MAX_PUBLIC_CONTACT_BYTES) {
    throw new RangeError(
      `${name} exceeds the ${MAX_PUBLIC_CONTACT_BYTES}-byte laboratory limit`,
    );
  }

  return contact;
}

/**
 * Produces the tagged, length-delimited input for the full experimental
 * relationship diagnostic. This byte layout is disposable study machinery,
 * not a selected fingerprint or protocol encoding.
 */
export function relationshipDigestInput(firstContact, secondContact) {
  const first = validateContact(firstContact, "first contact");
  const second = validateContact(secondContact, "second contact");
  const [lower, higher] =
    compareBytes(first, second) <= 0 ? [first, second] : [second, first];

  return concatBytes(
    domainTag,
    uint32be(lower.length),
    lower,
    uint32be(higher.length),
    higher,
  );
}
