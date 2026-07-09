\# github-api-spec.md



\# Purpose



The GitHub API Layer is responsible for collecting contribution activity from GitHub and transforming it into a normalized activity model consumed by the XP Engine.



The GitHub API Layer is the only component that communicates directly with GitHub.



All other systems should interact exclusively through the normalized activity contract.



\---



\# Responsibilities



The GitHub API Layer is responsible for:



✅ Authenticating with GitHub



✅ Querying GitHub activity



✅ Applying journey start date filtering



✅ Normalizing activity data



✅ Handling API failures



✅ Handling pagination



✅ Returning deterministic activity totals



The GitHub API Layer is NOT responsible for:



❌ XP calculations



❌ Journey progression



❌ Achievement evaluation



❌ Storage



❌ SVG rendering



\---



\# Design Philosophy



The API Layer should provide:



```text

Reliable Activity Data

```



The rest of the engine should not need to know:



```text

Which GitHub APIs were used

How pagination works

How rate limits are handled

```



The API Layer abstracts all GitHub complexity.



\---



\# Authentication



The system should use:



```text

GITHUB\_TOKEN

```



provided by GitHub Actions.



Implementation should support:



```text

Personal Access Token (PAT)

```



for local development.



\---



\# Configuration



Input:



```yaml

githubUser: "octocat"

```



Required:



```text

GitHub Username

Journey Start Date

```



\---



\# Activity Collection Window



Only contributions occurring on or after:



```yaml

journey:

&#x20; startDate: "2026-01-01"

```



should be counted.



All activity before this date must be ignored.



\---



\# Primary Output



The API Layer must return:



```ts

type Activity = {

&#x20; commits: number;



&#x20; prsOpened: number;



&#x20; prsMerged: number;



&#x20; issuesOpened: number;



&#x20; issuesClosed: number;



&#x20; reviewsSubmitted: number;



&#x20; repositoriesCreated: number;



&#x20; releasesPublished: number;



&#x20; streaks: number;

};

```



\---



\# Data Sources



Preferred approach:



```text

GitHub GraphQL API

```



Fallback:



```text

GitHub REST API

```



Reason:



```text

GraphQL allows aggregation of multiple metrics

with fewer requests.

```



\---



\# Activity Categories



The MVP supports:



```text

Commits

Pull Requests Opened

Pull Requests Merged

Issues Opened

Issues Closed

Reviews Submitted

Repositories Created

Releases Published

Contribution Streaks

```



\---



\# Commit Collection



\## Definition



A commit counts when:



```text

The configured user authored the commit

AND

The commit falls within the journey date range

```



\---



\# Counted



✅ Personal repositories



✅ Organization repositories



✅ Public repositories



✅ Contributions matching configured user



\---



\# Excluded



❌ Commits before startDate



❌ Commits from other users



\---



\# Output



```json

{

&#x20; "commits": 1234

}

```



\---



\# Pull Requests Opened



\## Definition



A pull request counts when:



```text

User opens a pull request

AND

Creation date >= startDate

```



\---



\# Output



```json

{

&#x20; "prsOpened": 57

}

```



\---



\# Pull Requests Merged



\## Definition



A pull request counts when:



```text

User authored the pull request

AND

GitHub shows merged = true

AND

Merge date >= startDate

```



\---



\# Output



```json

{

&#x20; "prsMerged": 42

}

```



\---



\# Issues Opened



\## Definition



Count issues created by the user.



Filter:



```text

Created Date >= startDate

```



\---



\# Output



```json

{

&#x20; "issuesOpened": 28

}

```



\---



\# Issues Closed



\## Definition



Count issues closed by the user.



Filter:



```text

Closed Date >= startDate

```



\---



\# Output



```json

{

&#x20; "issuesClosed": 19

}

```



\---



\# Reviews Submitted



\## Definition



Count pull request reviews submitted by the user.



Filter:



```text

Review Submitted Date >= startDate

```



\---



\# Output



```json

{

&#x20; "reviewsSubmitted": 31

}

```



\---



\# Repositories Created



\## Definition



Count repositories created by the user.



Filter:



```text

Repository Created Date >= startDate

```



\---



\# Output



```json

{

&#x20; "repositoriesCreated": 4

}

```



\---



\# Releases Published



\## Definition



Count releases published by the user.



Filter:



```text

Release Published Date >= startDate

```



\---



\# Output



```json

{

&#x20; "releasesPublished": 3

}

```



\---



\# Contribution Streaks



\## Purpose



Provide bonus XP for sustained activity.



\---



\# Definition



A contribution day is:



```text

A day containing at least one counted contribution.

```



Examples:



```text

Commit

Issue

Pull Request

Review

```



all qualify.



\---



\# Streak Calculation



Example:



```text

7 consecutive contribution days

=

1 streak

```



Example:



```text

14 consecutive contribution days

=

2 streaks

```



Example:



```text

21 consecutive contribution days

=

3 streaks

```



\---



\# Output



The API Layer returns:



```json

{

&#x20; "streaks": 3

}

```



The XP Engine determines XP value.



\---



\# Public Contributions



MVP supports:



```text

Public GitHub Activity Only

```



Reason:



```text

Works immediately after forking

No additional permissions

Simpler setup

More reliable onboarding

```



\---



\# Private Contributions



Not required in MVP.



Potential future support:



```yaml

includePrivateContributions: true

```



This is outside MVP scope.



\---



\# Pagination



GitHub API responses may span multiple pages.



The collector must:



✅ Handle pagination automatically



✅ Aggregate all pages



✅ Return complete totals



\---



\# Rate Limit Handling



The API Layer should minimize requests.



Strategies:



```text

Prefer GraphQL aggregation

Cache intermediate calls where possible

Request only required fields

```



\---



\# Failure Handling



The API Layer should fail gracefully.



Examples:



```text

Invalid username

Rate limit exceeded

Authentication failure

Network timeout

```



\---



\# Error Output Example



```json

{

&#x20; "error": true,

&#x20; "message": "Unable to collect pull request data."

}

```



Errors should be descriptive.



\---



\# Data Normalization



Regardless of API source:



```text

GraphQL

REST

Future APIs

```



The output contract must remain identical.



Example:



```json

{

&#x20; "commits": 1234,

&#x20; "prsOpened": 57,

&#x20; "prsMerged": 42,

&#x20; "issuesOpened": 28,

&#x20; "issuesClosed": 19,

&#x20; "reviewsSubmitted": 31,

&#x20; "repositoriesCreated": 4,

&#x20; "releasesPublished": 3,

&#x20; "streaks": 5

}

```



\---



\# Performance Targets



Preferred:



```text

< 10 seconds

```



Maximum:



```text

< 30 seconds

```



for typical users.



\---



\# Security Requirements



The API Layer must never:



❌ Persist tokens



❌ Commit tokens to storage



❌ Expose secrets in logs



❌ Store raw API responses



Only normalized activity totals should be returned.



\---



\# Testing Requirements



The API Layer should support:



```text

Mock Activity Responses

```



to allow testing without live GitHub requests.



Example:



```json

{

&#x20; "commits": 100,

&#x20; "prsMerged": 5

}

```



\---



\# Future Compatibility



Future versions may add:



```text

Private Contributions

Repository Weighting

Language-Based Bonuses

Organization Statistics

Contribution Graph Analysis

```



These features are not part of MVP.



\---



\# MVP Acceptance Criteria



The GitHub API Layer is complete when:



✅ Authenticates successfully



✅ Reads configured GitHub user



✅ Applies start date filtering



✅ Collects commits



✅ Collects opened PRs



✅ Collects merged PRs



✅ Collects opened issues



✅ Collects closed issues



✅ Collects reviews



✅ Collects repositories created



✅ Collects releases published



✅ Calculates contribution streaks



✅ Handles pagination



✅ Produces normalized activity output



✅ Supports GitHub Actions execution



✅ Uses public contributions only



✅ Requires no manual intervention after setup

