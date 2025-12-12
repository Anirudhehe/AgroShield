import {
  cacheLocaleBundle,
  getCachedLocale,
  cacheDiseaseDescription,
  getCachedDiseaseDescription,
} from "../utils/i18nCache";

describe("i18nCache IDB helpers", () => {
  test("cache and retrieve locale bundle", async () => {
    const lng = "test-lng";
    const data = { hello: "world" };
    const ok = await cacheLocaleBundle(lng, data);
    expect(ok).toBe(true);
    const cached = await getCachedLocale(lng);
    expect(cached).toEqual(data);
  });

  test("cache and retrieve disease description", async () => {
    const lng = "test-lng";
    const id = "sample-d";
    const payload = { id, title: "Sample" };
    const ok = await cacheDiseaseDescription(lng, id, payload);
    expect(ok).toBe(true);
    const cached = await getCachedDiseaseDescription(lng, id);
    expect(cached).toEqual(payload);
  });
});
