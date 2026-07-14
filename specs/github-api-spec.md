# GitHub Activity Collection Specification

## Purpose

The collector is the only engine component that communicates with GitHub. It converts public GitHub data into the versioned `ActivityReport` defined by the domain model.

It does not calculate XP, progression, titles, achievements, or rendering state.

## Scope And Privacy

The product collects public activity for one GitHub user. Private contribution access, organization-wide analysis, repository content, source code, and raw API response persistence are outside scope.

Authentication uses the workflow-provided `GITHUB_TOKEN` or an equivalent local token. Tokens are read from the environment or Action input, never configuration, logs, generated files, or errors.

The minimum practical token permissions are used. Authentication does not imply permission to collect private activity.

## Collection Window

Every request is bounded by:

```text
from = journey.startDate at 00:00:00 UTC, inclusive
to = current run timestamp, inclusive
```

The report records both dates. Activity outside the window is excluded.

## Metric Definitions

| Metric                | Definition                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `commits`             | Public commit contributions attributed by GitHub to the user in the window.                                             |
| `prsOpened`           | Public pull requests authored by the user and created in the window.                                                    |
| `prsMerged`           | Those authored pull requests whose merge timestamp is in the window.                                                    |
| `issuesOpened`        | Public issues authored by the user and created in the window; pull requests are excluded.                               |
| `issuesClosed`        | Authored public issues whose close timestamp is in the window. This does not claim the user performed the close action. |
| `reviewsSubmitted`    | Public pull request review submissions authored by the user in the window, excluding plain issue comments.              |
| `repositoriesCreated` | Non-fork public repositories owned by the user and created in the window.                                               |
| `releasesPublished`   | Public releases whose GitHub author is the user and whose publication timestamp is in the window.                       |
| `streaks`             | Number of complete seven-day blocks in the longest consecutive run of public contribution days in the window.           |

Definitions describe the intended data, not a particular query. An implementation must not substitute a looser proxy without issuing a warning that names the affected metric.

## Data Sources

GitHub GraphQL is preferred for contribution calendars and typed, paginated connections. GitHub REST may be used when it exposes a more accurate or maintainable source. Search APIs may be used only with explicit handling of result limits and query semantics.

The collector must:

- request only required fields;
- paginate until exhausted or a documented limit is reached;
- bound concurrency to avoid secondary rate limits;
- use stable ordering where pagination requires it;
- validate response shape before consuming data;
- deduplicate node IDs when sources overlap;
- retry transient failures with bounded exponential backoff and jitter;
- never retry authentication, authorization, validation, or not-found errors;
- honor GitHub retry and rate-limit headers where available.

## Completeness

An `ActivityReport` has `complete: true` only when every enabled metric was collected for the full window without a known cap or approximation.

Examples requiring `complete: false` and a warning:

- search results reached an API cap;
- a repository could not be inspected;
- a metric used an updated-date proxy rather than its specified event date;
- rate limiting caused a metric to be omitted;
- GitHub limits the available contribution window;
- a response was partially paginated.

The engine may continue with an incomplete report when usable counts exist, but the warning must be persisted and represented unobtrusively in the standard SVG. Authentication failure, unknown user, invalid data, or inability to collect any core metrics fails the run without modifying generated state.

Core metrics are commits, pull requests opened, and issues opened.

## Error Model

```ts
type GitHubCollectionErrorCode =
  | "AUTHENTICATION_FAILED"
  | "USER_NOT_FOUND"
  | "RATE_LIMITED"
  | "NETWORK_FAILED"
  | "INVALID_RESPONSE"
  | "COLLECTION_FAILED";
```

Errors include a stable code, safe human message, retryability, and optional metric. They must not contain tokens, request authorization headers, or complete API payloads.

## Determinism And Caching

Counts are sorted and normalized before use. Collection timestamps do not affect XP. Given equivalent GitHub data and collection boundaries, the report counts are identical.

Cross-run caching is optional. If introduced, cache entries must record query version, window, and expiry, and must never be the only persisted source of journey history.

## Test Requirements

- fixture tests cover every metric definition;
- pagination tests cover empty, single-page, and multi-page results;
- tests verify pull requests are not counted as issues;
- tests cover caps, partial results, and warnings;
- retries use fake time and do not delay the suite;
- malformed responses and safe error messages are tested;
- contract tests use recorded, sanitized fixtures, not live user data;
- CI does not require a real GitHub token.

## Acceptance Criteria

- only public, date-bounded activity is counted;
- each metric matches its documented semantics;
- partial data is never silently labelled complete;
- pagination and rate-limit behavior are bounded;
- secrets and raw responses are never persisted;
- failures leave existing generated artifacts untouched.
