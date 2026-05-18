# Contributing to Bulk Email Sender

Thank you for your interest in contributing! We welcome contributions from everyone.

## How to Contribute

### 1. Fork the Repository
- Click the "Fork" button at the top right of the repository page
- Clone your fork locally: `git clone https://github.com/YOUR_USERNAME/bulk-email-sender.git`

### 2. Set Up Your Development Environment

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Configure your .env file with necessary credentials
```

### 3. Create a Branch
Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix-name
```

Use descriptive branch names:
- `feature/add-smtp-provider` for new features
- `fix/email-validation-bug` for bug fixes
- `docs/update-readme` for documentation
- `refactor/improve-batch-service` for refactoring

### 4. Make Your Changes
- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Keep commits focused and atomic
- Write meaningful commit messages

#### Commit Message Format
```
type(scope): brief description

Detailed explanation if needed

Closes #issue_number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(emailService): add support for SendGrid provider

- Implement SendGrid API integration
- Add rate limiting for SendGrid
- Update configuration types

Closes #123
```

### 5. Test Your Changes
- Run existing tests: `npm test`
- Add new tests for new functionality
- Manually test your changes
- Ensure no regressions are introduced

### 6. Submit a Pull Request

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the original repository and click "New Pull Request"

3. Fill out the pull request template with:
   - Clear description of changes
   - Related issue numbers
   - Testing instructions
   - Screenshots (if UI changes)

4. Wait for review and address any feedback

## Pull Request Guidelines

### Before Submitting
- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings or errors
- [ ] Branch is up to date with main

### PR Requirements
- **Clear Title**: Summarize the change in one line
- **Description**: Explain what, why, and how
- **Link Issues**: Reference related issues
- **Tests**: Demonstrate that changes work
- **Documentation**: Update relevant docs

### Code Review Process
1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be part of the next release!

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types from `types.ts`

### Code Style
- Use 2 spaces for indentation
- Use meaningful variable and function names
- Keep functions small and focused
- Avoid deep nesting (max 3 levels)
- Use async/await over callbacks

### File Organization
```
src/
  routes/       - Express route handlers
  services/     - Business logic
  middleware/   - Express middleware
  types.ts      - Type definitions
```

## What to Contribute

### Good First Issues
Look for issues labeled `good first issue` or `help wanted`

### Ideas for Contributions
- 🐛 Bug fixes
- ✨ New features (discuss in an issue first)
- 📝 Documentation improvements
- 🧪 Test coverage
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- 🔒 Security improvements

### Major Changes
For significant changes, please:
1. Open an issue first to discuss
2. Wait for maintainer feedback
3. Ensure alignment with project goals

## Getting Help

- 📖 Check existing documentation
- 🔍 Search existing issues
- 💬 Open a new issue for questions
- 📧 Contact maintainers if needed

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal or political attacks
- Trolling or insulting comments
- Publishing others' private information
- Unprofessional conduct

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Recognition

All contributors will be recognized in the project. Thank you for making this project better! 🎉
