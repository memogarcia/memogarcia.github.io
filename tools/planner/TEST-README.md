# Planner App - E2E Test Suite

Comprehensive end-to-end testing for the Planner application using Puppeteer.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Run Tests

```bash
# Install dependencies and run tests with browser UI
./run-tests.sh

# Run tests in headless mode (faster, no browser UI)
./run-tests.sh --headless

# Or run directly with Node
npm install puppeteer
node e2e-test.js
```

## 🧪 Test Coverage

### Core Functionality Tests
- ✅ **App Loading** - Verifies all main components load correctly
- ✅ **Epic Creation** - Tests creating epics and UI updates
- ✅ **Task Creation** - Tests task creation and unaligned task tracking
- ✅ **Person Management** - Tests person creation and activity assignment

### UI Interaction Tests
- ✅ **Sidebar Collapse** - Tests collapsible sidebar with person icons
- ✅ **Dependency Mode** - Tests dependency mode activation and UI feedback
- ✅ **Drag & Drop** - Tests dragging tasks into epics
- ✅ **Zoom & Pan** - Tests canvas navigation controls

### Data Management Tests
- ✅ **Export Functionality** - Tests data export feature
- ✅ **Error Handling** - Tests edge cases and error conditions

### Cross-Device Tests
- ✅ **Mobile Responsiveness** - Tests mobile viewport and touch interactions
- ✅ **Performance** - Monitors memory usage and DOM performance

### Visual Validation
- 📸 **Screenshots** - Captures screenshots at key test points
- 🔍 **UI State Verification** - Validates visual elements and states

## 📊 Test Results

Tests generate:
- **Console Output** - Real-time test progress and results
- **Screenshots** - Visual validation saved to `test-screenshots/`
- **Performance Metrics** - Memory usage, DOM nodes, script duration
- **Success Rate** - Overall pass/fail percentage

## 🛠️ Test Structure

### PlannerE2ETest Class
- `setup()` - Browser initialization and app loading
- `test()` - Individual test wrapper with error handling
- `takeScreenshot()` - Visual documentation
- `cleanup()` - Resource cleanup
- `printResults()` - Summary reporting

### Key Test Methods
- `testAppLoading()` - Basic app functionality
- `testEpicCreation()` - Epic management features  
- `testTaskCreation()` - Task management features
- `testPersonCreation()` - People and activity management
- `testSidebarCollapse()` - UI interaction features
- `testDependencyMode()` - Dependency system features
- `testMobileViewport()` - Responsive design features
- `testPerformance()` - Performance monitoring

## 🎯 Usage Examples

### Basic Test Run
```bash
./run-tests.sh
```

### Headless CI/CD Mode
```bash
./run-tests.sh --headless
```

### Custom Test Configuration
```javascript
const tester = new PlannerE2ETest();
// Modify settings before running
tester.runAllTests();
```

## 📁 Output Files

- `test-screenshots/` - Visual validation screenshots
- Console logs with detailed test progress
- Exit code 0 for success, 1 for failures

## 🔧 Customization

### Adding New Tests
```javascript
await this.test('My new test', async () => {
    // Your test logic here
    await this.waitForElement('.my-element');
    // Assertions and interactions
});
```

### Modifying Screenshots
```javascript
await this.takeScreenshot('custom-screenshot-name');
```

### Performance Thresholds
Adjust in `testPerformance()`:
```javascript
if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) { // 50MB
    throw new Error('Memory usage too high');
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   - Ensure Puppeteer is installed: `npm install puppeteer`
   - Try headless mode: `./run-tests.sh --headless`

2. **Test Timeouts**
   - Increase timeout values in test methods
   - Check if app is loading properly

3. **Screenshot Failures**
   - Ensure write permissions in test directory
   - Check disk space for screenshot storage

### Debug Mode
Add console logging to specific tests:
```javascript
console.log('Debug: Current state', await this.page.evaluate(() => app.tasks.length));
```

## 🎉 Success Criteria

A successful test run should show:
- ✅ All core functionality tests passing
- ✅ UI interactions working correctly  
- ✅ Mobile responsiveness confirmed
- ✅ No JavaScript errors in browser console
- ✅ Performance metrics within acceptable ranges
- 📸 Screenshots captured for visual verification

The test suite ensures the Planner app works correctly across different devices and usage scenarios, providing confidence in deployments and feature updates.
