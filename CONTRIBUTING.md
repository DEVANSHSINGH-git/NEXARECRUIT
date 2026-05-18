# Contributing to NexaRecruit

Thank you for your interest in contributing to NexaRecruit. This document provides guidelines and standards for contributing to this project.

---

## Code of Conduct

By participating in this project, you agree to maintain a professional, inclusive, and respectful environment for all contributors.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your feature or fix: `git checkout -b feature/your-feature-name`
4. **Install dependencies** following the [Quick Start](README.md#-quick-start) guide
5. **Make your changes** following the conventions below
6. **Test** your changes thoroughly
7. **Submit** a pull request

---

## Development Standards

### Branch Naming

```
feature/   — New features (feature/batch-evaluation)
fix/       — Bug fixes (fix/auth-token-refresh)
docs/      — Documentation updates (docs/api-reference)
refactor/  — Code refactoring (refactor/pipeline-optimization)
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(ai-services): add batch evaluation endpoint
fix(backend): resolve JWT refresh race condition
docs(readme): update deployment instructions
refactor(frontend): extract score display component
```

### Code Style

| Language | Standard |
|----------|----------|
| TypeScript | ESLint + Prettier (2-space indent) |
| Python | Black formatter + isort + Ruff |
| SQL | Uppercase keywords, snake_case identifiers |

### Pull Request Requirements

- [ ] Clear description of changes and motivation
- [ ] All existing tests pass
- [ ] New features include appropriate tests
- [ ] No sensitive data (API keys, credentials) in commits
- [ ] Documentation updated if API contracts change

---

## Architecture Decisions

When proposing architectural changes, please include:

1. **Context** — What problem does this solve?
2. **Decision** — What approach are you taking?
3. **Consequences** — What are the trade-offs?

---

## Reporting Issues

Use GitHub Issues with the following labels:

- `bug` — Something isn't working
- `enhancement` — Feature request
- `documentation` — Documentation improvement
- `performance` — Performance-related issue

---

## Questions?

Open a Discussion on the repository for questions about architecture, design decisions, or contribution guidance.
