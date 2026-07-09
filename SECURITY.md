# Security Policy

## Reporting a Vulnerability

Please do not open a public issue for token leaks, authentication bypasses, or other sensitive security problems.

Report security concerns privately through GitHub security advisories if enabled, or contact the repository maintainer directly.

## Token Handling

This project should never:

- commit GitHub tokens
- write tokens to generated data files
- log tokens in CI output
- require personal access tokens for normal fork usage

The GitHub Action uses `GITHUB_TOKEN` provided by GitHub Actions.
