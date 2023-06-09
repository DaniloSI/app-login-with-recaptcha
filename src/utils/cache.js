import NodeCache from "node-cache";

const AMOUNT_OF_MEDIUM = "amount-of-medium";
const AMOUNT_OF_HARD = "amount-of-hard";

const FREQUENCY_TOLERANCE = {
  MEDIUM: 3,
  HARD: 7,
};

const THRESHOLD_TOLERANCE = {
  MEDIUM: 20,
  HARD: 10,
};

const LIMIT_REQUESTS = {
  SOFT: 10,
  MEDIUM: 5,
  HARD: 3,
};

const CACHE_DURATION_IN_MINUTES = 5;
const BLOCK_IN_MINUTES = 5;

const recaptchaCache = new NodeCache({
  stdTTL: 60 * CACHE_DURATION_IN_MINUTES,
});

recaptchaCache.on("set", (_, value) => {
  if (typeof value === "number") {
    if (value === FREQUENCY_TOLERANCE.MEDIUM) {
      const amountMedium = recaptchaCache.take(AMOUNT_OF_MEDIUM) ?? 0;
      recaptchaCache.set(AMOUNT_OF_MEDIUM, amountMedium + 1);
    }

    if (value === FREQUENCY_TOLERANCE.HARD) {
      const amountHard = recaptchaCache.take(AMOUNT_OF_HARD) ?? 0;
      recaptchaCache.set(AMOUNT_OF_HARD, amountHard + 1);
    }
  }
});

recaptchaCache.on("expired", (_, value) => {
  if (typeof value === "number") {
    const amountMedium = recaptchaCache.get(AMOUNT_OF_MEDIUM) ?? 0;
    const amountHard = recaptchaCache.get(AMOUNT_OF_HARD) ?? 0;

    if (value > FREQUENCY_TOLERANCE.MEDIUM && amountMedium > 0) {
      recaptchaCache.set(AMOUNT_OF_MEDIUM, amountMedium - 1);
    }

    if (value > FREQUENCY_TOLERANCE.HARD && amountHard > 0) {
      recaptchaCache.set(AMOUNT_OF_HARD, amountHard - 1);
    }
  }
});

const getLimitRequests = () => {
  const amountMedium = recaptchaCache.get(AMOUNT_OF_MEDIUM);
  const amountHard = recaptchaCache.get(AMOUNT_OF_HARD);

  if (amountHard > THRESHOLD_TOLERANCE.HARD) {
    return LIMIT_REQUESTS.HARD;
  }

  if (amountMedium > THRESHOLD_TOLERANCE.MEDIUM) {
    return LIMIT_REQUESTS.MEDIUM;
  }

  return LIMIT_REQUESTS.SOFT;
};

export const getIsBlocked = (key) => {
  const cachedVerifiedResponse = recaptchaCache.get(key) ?? 0;
  const BLOCK_MINUTES = BLOCK_IN_MINUTES * 60_000;

  return (
    typeof cachedVerifiedResponse === "object" &&
    cachedVerifiedResponse.getTime() + BLOCK_MINUTES > new Date().getTime()
  );
};

export const annotateRecaptchaResponse = (key) => {
  const cachedVerifiedResponse = recaptchaCache.take(key) ?? 0;
  const limitRequests = getLimitRequests();
  const block = cachedVerifiedResponse >= limitRequests;

  recaptchaCache.set(key, block ? new Date() : cachedVerifiedResponse + 1);
};
