// Which identity providers this server signs people in with (OpenID
// Connect), and how it reaches them. Each needs the server registered with
// that company: its owner sets the client it was given, as
//   PAGECRAFT_OIDC_GOOGLE_CLIENT_ID and PAGECRAFT_OIDC_GOOGLE_CLIENT_SECRET,
// and for a company's SSO also PAGECRAFT_OIDC_SSO_ISSUER. With
// PAGECRAFT_DEV_OIDC=1 every provider is the server's own test provider
// (server/oidc-dev.ts), to try the whole flow on this machine.
import { isFetchable } from "./link-preview.ts";

export const OIDC_PROVIDERS = [
  "google",
  "chatgpt",
  "apple",
  "microsoft",
  "sso",
] as const;
export type OidcProvider = (typeof OIDC_PROVIDERS)[number];

const ISSUERS: Readonly<Record<OidcProvider, string | undefined>> = {
  google: "https://accounts.google.com",
  chatgpt: "https://auth.openai.com",
  apple: "https://appleid.apple.com",
  microsoft: "https://login.microsoftonline.com/common/v2.0",
  sso: undefined,
};

export const DEV_ISSUER = "pagecraft-dev-idp";

export interface OidcConfig {
  readonly provider: OidcProvider;
  readonly issuer: string;
  readonly clientId: string;
  readonly clientSecret?: string;
}

export function isOidcProvider(value: string): value is OidcProvider {
  return OIDC_PROVIDERS.some((provider) => provider === value);
}

export function oidcConfigOf(
  provider: OidcProvider,
  env: NodeJS.ProcessEnv = process.env,
): OidcConfig | undefined {
  if (env.PAGECRAFT_DEV_OIDC === "1") {
    return { provider, issuer: DEV_ISSUER, clientId: "pagecraft" };
  }
  const key = `PAGECRAFT_OIDC_${provider.toUpperCase()}`;
  const clientId = env[`${key}_CLIENT_ID`];
  const issuer = env[`${key}_ISSUER`] ?? ISSUERS[provider];
  if (clientId === undefined || issuer === undefined) return undefined;
  const clientSecret = env[`${key}_CLIENT_SECRET`];
  return {
    provider,
    issuer,
    clientId,
    ...(clientSecret === undefined ? {} : { clientSecret }),
  };
}

// The ID token's issuer may name a tenant where the configured one is
// "common", as Microsoft's does.
export function issuerMatches(config: OidcConfig, issuer: string): boolean {
  if (config.issuer === issuer) return true;
  const common = config.issuer.replace("/common/", "/[^/]+/");
  return (
    common !== config.issuer &&
    new RegExp(`^${common.replace(/\./g, "\\.")}$`).test(issuer)
  );
}

// What the server asks of a provider; the web's, or the test provider's.
export interface IdentityWeb {
  readonly getText: (url: URL) => Promise<string | undefined>;
  readonly postForm: (
    url: URL,
    fields: Readonly<Record<string, string>>,
  ) => Promise<string | undefined>;
}

const TIME_LIMIT_MS = 8000;

export const webIdentity: IdentityWeb = {
  getText: async (url) => {
    if (url.protocol !== "https:" || !isFetchable(url)) return undefined;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIME_LIMIT_MS),
      });
      return response.ok ? await response.text() : undefined;
    } catch {
      return undefined;
    }
  },
  postForm: async (url, fields) => {
    if (url.protocol !== "https:" || !isFetchable(url)) return undefined;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fields),
        signal: AbortSignal.timeout(TIME_LIMIT_MS),
      });
      return response.ok ? await response.text() : undefined;
    } catch {
      return undefined;
    }
  },
};
