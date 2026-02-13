## Debug Info for Angular Components

When I ask you to add debug info to a component, use the following pattern:

### TypeScript file
Add a `debugInfo` object property and an `updateDebugInfo()` method:

```typescript
// Debug properties for display size detection
debugInfo = {
  viewportHeight: 0,
  viewportWidth: 0,
  devicePixelRatio: 0,
  rootFontSize: '',
  textScaleFactor: 1
};

// Call this in ngOnInit()
updateDebugInfo() {
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  );
  const textScaleFactor = rootFontSize / 16;

  this.debugInfo = {
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio,
    rootFontSize: rootFontSize + 'px',
    textScaleFactor: Math.round(textScaleFactor * 100) / 100
  };
}
```

### HTML template
Add a yellow debug div at the top of the component:

```html
<!-- DEBUG: Remove this div after testing -->
<div style="background: #ffeb3b; padding: 8px; font-size: 12px; margin-bottom: 10px; border-radius: 4px;">
  <strong>DEBUG INFO:</strong><br>
  Viewport: {{ debugInfo.viewportWidth }}x{{ debugInfo.viewportHeight }}<br>
  Root Font Size: {{ debugInfo.rootFontSize }}<br>
  Text Scale Factor: {{ debugInfo.textScaleFactor }} (1 = normal, >1 = enlarged)<br>
  Device Pixel Ratio: {{ debugInfo.devicePixelRatio }}
</div>
<!-- END DEBUG -->%    