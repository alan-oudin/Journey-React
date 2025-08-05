const fs = require('fs');
const path = require('path');

class TestLogger {
    constructor(logDir = 'test-logs') {
        this.logDir = path.join(process.cwd(), logDir);
        this.ensureLogDir();
        this.startTime = new Date();
        this.testResults = {
            suite: 'Unknown',
            startTime: this.startTime,
            endTime: null,
            duration: 0,
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                errors: []
            },
            details: [],
            environment: this.getEnvironmentInfo()
        };
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getEnvironmentInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            timestamp: new Date().toISOString(),
            user: process.env.USERNAME || process.env.USER || 'unknown',
            ci: !!process.env.CI
        };
    }

    setSuite(suiteName) {
        this.testResults.suite = suiteName;
    }

    logTestStart(testName, category = 'unit') {
        console.log(`🧪 [${category.toUpperCase()}] Starting: ${testName}`);
        this.testResults.details.push({
            name: testName,
            category: category,
            status: 'running',
            startTime: new Date(),
            endTime: null,
            duration: 0,
            error: null
        });
    }

    logTestResult(testName, status, error = null, details = {}) {
        const testIndex = this.testResults.details.findIndex(t => t.name === testName);
        const now = new Date();
        
        if (testIndex >= 0) {
            this.testResults.details[testIndex].status = status;
            this.testResults.details[testIndex].endTime = now;
            this.testResults.details[testIndex].duration = now - this.testResults.details[testIndex].startTime;
            this.testResults.details[testIndex].error = error;
            this.testResults.details[testIndex].details = details;
        }

        // Update summary
        this.testResults.summary.total++;
        switch (status) {
            case 'passed':
                this.testResults.summary.passed++;
                console.log(`✅ [PASS] ${testName}`);
                break;
            case 'failed':
                this.testResults.summary.failed++;
                this.testResults.summary.errors.push({ test: testName, error });
                console.log(`❌ [FAIL] ${testName}: ${error?.message || error}`);
                break;
            case 'skipped':
                this.testResults.summary.skipped++;
                console.log(`⏭️  [SKIP] ${testName}`);
                break;
        }
    }

    logError(message, error = null) {
        const errorInfo = {
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.summary.errors.push(errorInfo);
        console.error(`🚨 ERROR: ${message}`, error ? error.message : '');
    }

    logInfo(message, data = null) {
        console.log(`ℹ️  INFO: ${message}`);
        if (data) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
    }

    logWarning(message) {
        console.warn(`⚠️  WARNING: ${message}`);
    }

    finalize() {
        this.testResults.endTime = new Date();
        this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
        
        this.generateReport();
        this.printSummary();
        
        return this.testResults;
    }

    generateReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `test-report-${this.testResults.suite}-${timestamp}.json`;
        const filepath = path.join(this.logDir, filename);
        
        // JSON détaillé
        fs.writeFileSync(filepath, JSON.stringify(this.testResults, null, 2));
        
        // Rapport markdown
        const mdFilename = filename.replace('.json', '.md');
        const mdFilepath = path.join(this.logDir, mdFilename);
        fs.writeFileSync(mdFilepath, this.generateMarkdownReport());
        
        console.log(`📄 Reports generated:`);
        console.log(`   JSON: ${filepath}`);
        console.log(`   MD:   ${mdFilepath}`);
    }

    generateMarkdownReport() {
        const { suite, startTime, endTime, duration, summary, details, environment } = this.testResults;
        const successRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
        
        return `# 📊 Test Report - ${suite}

## 📋 Summary

| Metric | Value |
|--------|-------|
| **Suite** | ${suite} |
| **Start Time** | ${startTime.toISOString()} |
| **End Time** | ${endTime.toISOString()} |
| **Duration** | ${Math.round(duration / 1000)}s |
| **Total Tests** | ${summary.total} |
| **✅ Passed** | ${summary.passed} |
| **❌ Failed** | ${summary.failed} |
| **⏭️ Skipped** | ${summary.skipped} |
| **Success Rate** | ${successRate}% |

## 🎯 Test Results

${details.map(test => `
### ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'} ${test.name}

- **Category:** ${test.category}
- **Status:** ${test.status}
- **Duration:** ${Math.round(test.duration)}ms
${test.error ? `- **Error:** \`${test.error.message || test.error}\`` : ''}
${test.details && Object.keys(test.details).length > 0 ? `- **Details:** ${JSON.stringify(test.details, null, 2)}` : ''}
`).join('')}

## 🚨 Errors (${summary.errors.length})

${summary.errors.length > 0 ? summary.errors.map(err => `
### ${err.test || 'General Error'}
\`\`\`
${err.error?.message || err.message || err.error || err}
\`\`\`
${err.error?.stack ? `
**Stack Trace:**
\`\`\`
${err.error.stack}
\`\`\`
` : ''}
`).join('') : 'No errors recorded.'}

## 🖥️ Environment

| Property | Value |
|----------|-------|
| **Node Version** | ${environment.nodeVersion} |
| **Platform** | ${environment.platform} |
| **Architecture** | ${environment.arch} |
| **User** | ${environment.user} |
| **CI Environment** | ${environment.ci ? 'Yes' : 'No'} |
| **Working Directory** | ${environment.cwd} |

## 📈 Performance Analysis

${this.generatePerformanceAnalysis()}

---
*Generated on ${new Date().toISOString()}*
`;
    }

    generatePerformanceAnalysis() {
        const { details } = this.testResults;
        if (details.length === 0) return 'No performance data available.';
        
        const durations = details
            .filter(t => t.duration > 0)
            .map(t => ({ name: t.name, duration: t.duration }))
            .sort((a, b) => b.duration - a.duration);
            
        const avgDuration = durations.reduce((sum, t) => sum + t.duration, 0) / durations.length;
        const slowTests = durations.filter(t => t.duration > avgDuration * 2);
        
        return `
**Average Test Duration:** ${Math.round(avgDuration)}ms

**Slowest Tests:**
${durations.slice(0, 5).map(t => `- ${t.name}: ${Math.round(t.duration)}ms`).join('\n')}

${slowTests.length > 0 ? `
**⚠️ Performance Concerns (> ${Math.round(avgDuration * 2)}ms):**
${slowTests.map(t => `- ${t.name}: ${Math.round(t.duration)}ms`).join('\n')}
` : '**✅ No performance concerns detected.**'}
`;
    }

    printSummary() {
        const { summary, duration } = this.testResults;
        const successRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST EXECUTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Suite: ${this.testResults.suite}`);
        console.log(`Duration: ${Math.round(duration / 1000)}s`);
        console.log(`Total Tests: ${summary.total}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`⏭️ Skipped: ${summary.skipped}`);
        console.log(`Success Rate: ${successRate}%`);
        
        if (summary.errors.length > 0) {
            console.log('\n🚨 ERRORS:');
            summary.errors.forEach((err, index) => {
                console.log(`${index + 1}. ${err.test || 'Unknown'}: ${err.error?.message || err.message || err}`);
            });
        }
        
        console.log('\n' + (successRate >= 90 ? '🎉 EXCELLENT!' : successRate >= 75 ? '✅ GOOD' : successRate >= 50 ? '⚠️ NEEDS IMPROVEMENT' : '🚨 CRITICAL'));
        console.log('='.repeat(60));
    }

    // Intégration avec Jest
    static createJestReporter() {
        const logger = new TestLogger();
        logger.setSuite('Jest Frontend Tests');
        
        return {
            onRunStart: () => {
                logger.logInfo('Jest test run started');
            },
            
            onTestStart: (test) => {
                logger.logTestStart(test.path.split('/').pop(), 'jest');
            },
            
            onTestResult: (test, testResult) => {
                const testName = test.path.split('/').pop();
                
                if (testResult.numFailingTests > 0) {
                    const errors = testResult.failureMessage;
                    logger.logTestResult(testName, 'failed', errors);
                } else if (testResult.skipped) {
                    logger.logTestResult(testName, 'skipped');
                } else {
                    logger.logTestResult(testName, 'passed', null, {
                        assertionResults: testResult.numPassingTests,
                        performance: testResult.perfStats
                    });
                }
            },
            
            onRunComplete: () => {
                logger.finalize();
            }
        };
    }
}

module.exports = TestLogger;