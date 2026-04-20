import { http, HttpResponse } from "msw";
import { buildBundle, translateOne, type Locale } from "./translations";

export const handlers = [
  http.get("https://mock.i18nez.test/translate/bundle", async ({ request }) => {
    const url = new URL(request.url);
    const target = (url.searchParams.get("target_locale") ?? "en") as Locale;
    const translations = await buildBundle(target);
    return HttpResponse.json({
      locale: target,
      translations,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post(
    "https://mock.i18nez.test/translate",
    async ({ request }) => {
      const body = (await request.json()) as {
        text: string;
        target_locale: Locale;
      };
      const text = await translateOne(body.text, body.target_locale);
      return HttpResponse.json({
        text,
        source: body.text,
        cached: false,
      });
    },
  ),

  http.post(
    "https://mock.i18nez.test/translate/batch",
    async ({ request }) => {
      const body = (await request.json()) as {
        texts: string[];
        target_locale: Locale;
      };
      const results = await Promise.all(
        body.texts.map(async (t) => ({
          text: await translateOne(t, body.target_locale),
          source: t,
          cached: false,
        })),
      );
      return HttpResponse.json({ results });
    },
  ),
];
