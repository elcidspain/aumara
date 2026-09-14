# auth.md for AUMARA

## Agent registration
AUMARA supports anonymous agent access for its public, read-only discovery surfaces. No account, OAuth token, API key, client secret or paid credential is required or issued for the public MCP and A2A endpoints.

```yaml
agent_auth:
  skill: public-read-only-guest-discovery
  register_uri: https://www.aumara.me/auth.md#agent-registration
  methods:
    - type: anonymous
      credentials: none
      endpoints:
        - https://www.aumara.me/mcp
        - https://www.aumara.me/a2a
```

The `register_uri` documents the provisioning policy rather than creating an account: public agents are provisioned by anonymous access and use no credential. Protected or write-capable agent access is not offered.

## Public access
AUMARA's public website, FAQ, legal/policy pages, sitemap, llms.txt, discovery catalogs, MCP endpoint and A2A endpoint are public read-only resources.

## Reservations
The public agent endpoints do not create, change or cancel reservations. Direct reservations are completed in the external Beds24 booking interface at https://beds24.com/booking2.php?propid=324882, where live price, availability and booking conditions are shown.

## Agent behaviour
Automated clients may read public guest information subject to robots.txt, normal HTTP controls and rate limits. Do not infer an OAuth issuer, protected API, payment protocol or privileged credential flow that is not explicitly published.

Last updated: 2026-09-14
