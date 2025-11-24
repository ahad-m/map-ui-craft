# Contributing to Smart Real Estate Assistant

Thank you for your interest in contributing! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

### Our Pledge

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Required Software**:
   - Node.js 18.x or 20.x
   - Python 3.10+
   - Git 2.40+
   - PostgreSQL 13+ (or Supabase account)

2. **API Keys**:
   - Google Maps API key
   - OpenAI API key
   - Supabase project credentials

### Setup for Development

1. **Fork the Repository**
   ```bash
   # Click "Fork" button on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/project-name.git
   cd project-name
   ```

2. **Set Up Frontend**
   ```bash
   # Install dependencies
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your API keys
   
   # Start development server
   npm run dev
   ```

3. **Set Up Backend**
   ```bash
   cd Backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create .env file
   # Add: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY
   
   # Start server
   python main.py
   ```

4. **Verify Setup**
   - Frontend: Visit `http://localhost:8080`
   - Backend: Visit `http://localhost:8000/docs`

## Development Workflow

### 1. Create a Branch

Always create a new branch for your feature or fix:

```bash
# Feature branch
git checkout -b feature/amazing-new-feature

# Bug fix branch
git checkout -b fix/bug-description

# Documentation branch
git checkout -b docs/documentation-improvement
```

### 2. Make Your Changes

- Follow the [Code Style Guidelines](#code-style-guidelines)
- Write or update tests as needed
- Update documentation if necessary

### 3. Test Your Changes

```bash
# Frontend tests
npm test

# Backend tests
cd Backend
pytest

# Run specific test file
pytest test_university_search.py
```

### 4. Commit Your Changes

Follow our [Commit Message Guidelines](#commit-message-guidelines):

```bash
git add .
git commit -m "feat: add property comparison feature"
```

### 5. Push and Create PR

```bash
git push origin feature/amazing-new-feature
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### General Principles

1. **Write Clean Code**
   - Keep functions small and focused
   - Use descriptive variable names
   - Avoid magic numbers
   - Comment complex logic

2. **DRY (Don't Repeat Yourself)**
   - Extract reusable logic into functions/components
   - Create utility functions for common operations

3. **Performance**
   - Optimize database queries
   - Use React.memo for expensive components
   - Lazy load images and components

### Frontend (React/TypeScript)

#### Component Structure

```tsx
import React from 'react';
import { Button } from '@/components/ui/button';

// Props interface with JSDoc
interface PropertyCardProps {
  /** Property ID from database */
  id: string;
  /** Property title in Arabic/English */
  title: string;
  /** Price in SAR */
  price: number;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * PropertyCard component displays a single property listing
 * with image, title, price, and action buttons.
 * 
 * @example
 * <PropertyCard 
 *   id="123" 
 *   title="Villa in Riyadh"
 *   price={500000}
 *   onClick={handleClick}
 * />
 */
export const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  title,
  price,
  onClick
}) => {
  // Component logic here
  
  return (
    <div className="rounded-lg border bg-card">
      {/* JSX here */}
    </div>
  );
};
```

#### React Best Practices

- Use functional components with hooks
- Avoid inline functions in JSX when possible
- Use `useMemo` and `useCallback` for expensive operations
- Destructure props in function signature
- Use semantic HTML elements

#### TypeScript

- Always define types/interfaces for props
- Avoid `any` - use `unknown` if necessary
- Use type guards for runtime checks
- Leverage union types and enums

#### Styling

- Use Tailwind CSS utility classes
- Use semantic tokens from design system (e.g., `bg-background`, not `bg-white`)
- Avoid inline styles unless necessary
- Follow mobile-first responsive design

### Backend (Python/FastAPI)

#### Function Structure

```python
from typing import List, Optional
from models import Property, PropertyCriteria

def search_properties(
    criteria: PropertyCriteria,
    limit: int = 20,
    offset: int = 0
) -> List[Property]:
    """
    Search for properties matching the given criteria.
    
    This function performs a hybrid search combining SQL filtering
    with vector similarity search for semantic matching.
    
    Args:
        criteria: Search criteria including type, price, location
        limit: Maximum number of results to return (default: 20)
        offset: Number of results to skip for pagination (default: 0)
    
    Returns:
        List of Property objects matching the criteria
        
    Raises:
        ValueError: If criteria is invalid
        DatabaseError: If database connection fails
        
    Example:
        >>> criteria = PropertyCriteria(
        ...     property_type="villa",
        ...     max_price=1000000
        ... )
        >>> properties = search_properties(criteria, limit=10)
        >>> print(len(properties))
        10
    """
    # Function implementation
    pass
```

#### Python Best Practices

- Use type hints for all function parameters and returns
- Write comprehensive docstrings (Google style)
- Use meaningful variable names
- Follow PEP 8 style guide
- Handle exceptions gracefully
- Log important events and errors

#### Error Handling

```python
import logging

logger = logging.getLogger(__name__)

try:
    result = perform_operation()
except SpecificError as e:
    logger.error(f"Failed to perform operation: {e}")
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.exception("Unexpected error occurred")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Database

#### Query Optimization

- Use indexes on frequently filtered columns
- Avoid SELECT * - specify columns
- Use EXPLAIN ANALYZE to check query plans
- Batch operations when possible

#### Naming Conventions

- Tables: lowercase, plural (e.g., `properties`, `users`)
- Columns: lowercase with underscores (e.g., `created_at`, `user_id`)
- Indexes: `idx_table_column` (e.g., `idx_properties_district`)
- Functions: lowercase with underscores (e.g., `search_properties_nearby`)

## Testing Guidelines

### Frontend Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyCard } from './PropertyCard';

describe('PropertyCard', () => {
  it('renders property title and price', () => {
    render(
      <PropertyCard 
        id="123"
        title="Test Villa"
        price={500000}
      />
    );
    
    expect(screen.getByText('Test Villa')).toBeInTheDocument();
    expect(screen.getByText('500,000 SAR')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <PropertyCard 
        id="123"
        title="Test Villa"
        price={500000}
        onClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend Testing

```python
import pytest
from models import PropertyCriteria
from search_engine import search_engine

def test_search_properties_basic():
    """Test basic property search functionality"""
    criteria = PropertyCriteria(
        purpose="للبيع",
        property_type="فلل",
        max_price=1000000
    )
    
    results = search_engine.search(criteria)
    
    assert len(results) > 0
    assert all(p.purpose == "للبيع" for p in results)
    assert all(p.property_type == "فلل" for p in results)
    assert all(p.price_num <= 1000000 for p in results)

def test_search_properties_with_location():
    """Test property search near university"""
    criteria = PropertyCriteria(
        purpose="للايجار",
        property_type="شقق",
        university_requirements={
            "required": True,
            "university_name": "جامعة الملك سعود",
            "max_distance_minutes": 15
        }
    )
    
    results = search_engine.search(criteria)
    
    assert len(results) > 0
    # Verify all properties have nearby universities
```

### Test Coverage

- Aim for >80% code coverage
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Test edge cases and error conditions

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)

### Examples

```bash
# Feature
feat(search): add property comparison feature

# Bug fix
fix(api): correct university name matching logic

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(components): extract PropertyCard component

# Performance
perf(search): optimize vector similarity calculation
```

### Best Practices

- Use present tense ("add feature" not "added feature")
- Keep subject line under 50 characters
- Capitalize first letter
- Don't end with period
- Use body to explain what and why (not how)
- Reference issues: `Closes #123`

## Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update README if needed
   - Add JSDoc/docstrings for new functions
   - Update API documentation if endpoints changed

2. **Test Thoroughly**
   - All tests pass
   - No console errors
   - Test in multiple browsers (if frontend)
   - Test with different data scenarios

3. **Clean Up**
   - Remove debug code
   - Remove commented-out code
   - Fix linting errors
   - Format code properly

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test the changes

## Screenshots
(if applicable)

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] No new warnings
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs
   - Tests must pass
   - Linting must pass

2. **Code Review**
   - At least one maintainer approval required
   - Address review comments
   - Make requested changes

3. **Merge**
   - Squash and merge (for features)
   - Rebase and merge (for fixes)
   - Maintainer will merge

## Questions?

- Check existing [Issues](link-to-issues)
- Read the [Documentation](link-to-docs)
- Ask in [Discussions](link-to-discussions)
- Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Project credits

Thank you for contributing! 🎉
