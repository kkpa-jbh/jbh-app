# JBH App

Ionic/Angular hybrid mobile application.

## Getting Started

```bash
npm install
ionic serve              # Web development
ionic cap run ios -l     # iOS live reload
ionic cap run android -l # Android live reload
ionic build --prod       # Production build
```

## Brand Colors

### Primary Colors

| Color | HEX | CSS Variable | Preview |
|-------|-----|--------------|---------|
| Primary | `#667eea` | `--jbh-primary-color` | ![#667eea](https://via.placeholder.com/20/667eea/667eea.png) |
| Primary Dark | `#5568d3` | `--jbh-primary-dark` | ![#5568d3](https://via.placeholder.com/20/5568d3/5568d3.png) |
| Secondary | `#764ba2` | `--jbh-secondary-color` | ![#764ba2](https://via.placeholder.com/20/764ba2/764ba2.png) |
| Secondary Dark | `#6a4193` | `--jbh-secondary-dark` | ![#6a4193](https://via.placeholder.com/20/6a4193/6a4193.png) |

### Brand Gradient

```css
linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

### Semantic Colors

| Color | HEX | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Success | `#48bb78` | `--jbh-success-color` | Positive actions, confirmations |
| Error | `#f56565` | `--jbh-error-color` | Errors, destructive actions |
| Warning | `#ed8936` | `--jbh-warning-color` | Warnings, cautions |
| Info | `#4299e1` | `--jbh-info-color` | Informational messages |

### Neutral Colors

| Color | HEX | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Text Primary | `#2d3748` | `--jbh-text-primary` | Main text |
| Text Secondary | `#718096` | `--jbh-text-secondary` | Secondary text |
| Text Tertiary | `#a0aec0` | `--jbh-text-tertiary` | Placeholder text |
| Border | `#e1e4e8` | `--jbh-border-color` | Borders, dividers |
| Background Light | `#f7f8fa` | `--jbh-background-light` | Light backgrounds |
| Background White | `#ffffff` | `--jbh-background-white` | White backgrounds |

### Color Palette Summary

```
Primary Palette:
#667eea  #5568d3  #764ba2  #6a4193

Semantic Palette:
#48bb78 (success)  #f56565 (error)  #ed8936 (warning)  #4299e1 (info)

Neutral Palette:
#2d3748  #718096  #a0aec0  #e1e4e8  #f7f8fa  #ffffff
```

All colors are defined in `src/theme/custom-components.scss`.

# Versioning

```
1. ✅ Run npm run version:patch - verify version increments (e.g., 1.0.0 → 1.0.1)
2. ✅ Run npm run version:minor - verify version increments (e.g., 1.0.1 → 1.1.0)
3. ✅ Run npm run version:major - verify version increments (e.g., 1.1.0 → 2.0.0)
```

## Documentation

- [Architecture](docs/architecture.md)
- [Theming](docs/theming.md)
- [Forms](docs/forms.md)
- [i18n](docs/i18n.md)
- [Responsive](docs/responsive.md)
