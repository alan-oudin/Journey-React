<?php

namespace Journey\Tests;

class TestLogger {
    private $logDir;
    private $startTime;
    private $testResults;
    
    public function __construct($logDir = 'test-logs') {
        $this->logDir = getcwd() . DIRECTORY_SEPARATOR . $logDir;
        $this->ensureLogDir();
        $this->startTime = new \DateTime();
        $this->testResults = [
            'suite' => 'PHPUnit Backend Tests',
            'startTime' => $this->startTime->format('c'),
            'endTime' => null,
            'duration' => 0,
            'summary' => [
                'total' => 0,
                'passed' => 0,
                'failed' => 0,
                'skipped' => 0,
                'errors' => []
            ],
            'details' => [],
            'environment' => $this->getEnvironmentInfo()
        ];
    }
    
    private function ensureLogDir() {
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0777, true);
        }
    }
    
    private function getEnvironmentInfo() {
        return [
            'phpVersion' => phpversion(),
            'os' => php_uname(),
            'cwd' => getcwd(),
            'timestamp' => date('c'),
            'user' => get_current_user(),
            'memoryLimit' => ini_get('memory_limit'),
            'maxExecutionTime' => ini_get('max_execution_time')
        ];
    }
    
    public function setSuite($suiteName) {
        $this->testResults['suite'] = $suiteName;
    }
    
    public function logTestStart($testName, $category = 'unit') {
        echo "🧪 [{$category}] Starting: {$testName}\n";
        $this->testResults['details'][] = [
            'name' => $testName,
            'category' => $category,
            'status' => 'running',
            'startTime' => new \DateTime(),
            'endTime' => null,
            'duration' => 0,
            'error' => null,
            'details' => []
        ];
    }
    
    public function logTestResult($testName, $status, $error = null, $details = []) {
        $testIndex = null;
        foreach ($this->testResults['details'] as $index => $test) {
            if ($test['name'] === $testName) {
                $testIndex = $index;
                break;
            }
        }
        
        $now = new \DateTime();
        
        if ($testIndex !== null) {
            $this->testResults['details'][$testIndex]['status'] = $status;
            $this->testResults['details'][$testIndex]['endTime'] = $now;
            $startTime = $this->testResults['details'][$testIndex]['startTime'];
            $this->testResults['details'][$testIndex]['duration'] = 
                $now->getTimestamp() - $startTime->getTimestamp();
            $this->testResults['details'][$testIndex]['error'] = $error;
            $this->testResults['details'][$testIndex]['details'] = $details;
        }
        
        // Update summary
        $this->testResults['summary']['total']++;
        switch ($status) {
            case 'passed':
                $this->testResults['summary']['passed']++;
                echo "✅ [PASS] {$testName}\n";
                break;
            case 'failed':
                $this->testResults['summary']['failed']++;
                $this->testResults['summary']['errors'][] = [
                    'test' => $testName,
                    'error' => $error
                ];
                echo "❌ [FAIL] {$testName}: " . ($error ?: 'Unknown error') . "\n";
                break;
            case 'skipped':
                $this->testResults['summary']['skipped']++;
                echo "⏭️  [SKIP] {$testName}\n";
                break;
        }
    }
    
    public function logError($message, $error = null) {
        $errorInfo = [
            'message' => $message,
            'error' => $error,
            'timestamp' => date('c')
        ];
        
        $this->testResults['summary']['errors'][] = $errorInfo;
        echo "🚨 ERROR: {$message}" . ($error ? " - {$error}" : '') . "\n";
    }
    
    public function logInfo($message, $data = null) {
        echo "ℹ️  INFO: {$message}\n";
        if ($data) {
            echo "   Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
        }
    }
    
    public function logWarning($message) {
        echo "⚠️  WARNING: {$message}\n";
    }
    
    public function finalize() {
        $this->testResults['endTime'] = date('c');
        $endTime = new \DateTime();
        $this->testResults['duration'] = $endTime->getTimestamp() - $this->startTime->getTimestamp();
        
        $this->generateReport();
        $this->printSummary();
        
        return $this->testResults;
    }
    
    private function generateReport() {
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "test-report-phpunit-{$timestamp}.json";
        $filepath = $this->logDir . DIRECTORY_SEPARATOR . $filename;
        
        // JSON détaillé
        file_put_contents($filepath, json_encode($this->testResults, JSON_PRETTY_PRINT));
        
        // Rapport markdown
        $mdFilename = str_replace('.json', '.md', $filename);
        $mdFilepath = $this->logDir . DIRECTORY_SEPARATOR . $mdFilename;
        file_put_contents($mdFilepath, $this->generateMarkdownReport());
        
        echo "📄 Reports generated:\n";
        echo "   JSON: {$filepath}\n";
        echo "   MD:   {$mdFilepath}\n";
    }
    
    private function generateMarkdownReport() {
        $summary = $this->testResults['summary'];
        $successRate = $summary['total'] > 0 ? 
            round(($summary['passed'] / $summary['total']) * 100) : 0;
        
        $md = "# 📊 Test Report - {$this->testResults['suite']}\n\n";
        
        $md .= "## 📋 Summary\n\n";
        $md .= "| Metric | Value |\n";
        $md .= "|--------|---------|\n";
        $md .= "| **Suite** | {$this->testResults['suite']} |\n";
        $md .= "| **Start Time** | {$this->testResults['startTime']} |\n";
        $md .= "| **End Time** | {$this->testResults['endTime']} |\n";
        $md .= "| **Duration** | {$this->testResults['duration']}s |\n";
        $md .= "| **Total Tests** | {$summary['total']} |\n";
        $md .= "| **✅ Passed** | {$summary['passed']} |\n";
        $md .= "| **❌ Failed** | {$summary['failed']} |\n";
        $md .= "| **⏭️ Skipped** | {$summary['skipped']} |\n";
        $md .= "| **Success Rate** | {$successRate}% |\n\n";
        
        $md .= "## 🎯 Test Results\n\n";
        foreach ($this->testResults['details'] as $test) {
            $emoji = $test['status'] === 'passed' ? '✅' : 
                    ($test['status'] === 'failed' ? '❌' : '⏭️');
            $md .= "### {$emoji} {$test['name']}\n\n";
            $md .= "- **Category:** {$test['category']}\n";
            $md .= "- **Status:** {$test['status']}\n";
            $md .= "- **Duration:** {$test['duration']}s\n";
            if ($test['error']) {
                $md .= "- **Error:** `{$test['error']}`\n";
            }
            $md .= "\n";
        }
        
        $md .= "## 🚨 Errors (" . count($summary['errors']) . ")\n\n";
        if (count($summary['errors']) > 0) {
            foreach ($summary['errors'] as $error) {
                $testName = isset($error['test']) ? $error['test'] : 'General Error';
                $errorMsg = isset($error['error']) ? $error['error'] : 
                           (isset($error['message']) ? $error['message'] : 'Unknown error');
                $md .= "### {$testName}\n";
                $md .= "```\n{$errorMsg}\n```\n\n";
            }
        } else {
            $md .= "No errors recorded.\n\n";
        }
        
        $md .= "## 🖥️ Environment\n\n";
        $md .= "| Property | Value |\n";
        $md .= "|----------|---------|\n";
        $env = $this->testResults['environment'];
        $md .= "| **PHP Version** | {$env['phpVersion']} |\n";
        $md .= "| **OS** | {$env['os']} |\n";
        $md .= "| **User** | {$env['user']} |\n";
        $md .= "| **Memory Limit** | {$env['memoryLimit']} |\n";
        $md .= "| **Max Execution Time** | {$env['maxExecutionTime']} |\n";
        $md .= "| **Working Directory** | {$env['cwd']} |\n\n";
        
        $md .= "## 📈 Performance Analysis\n\n";
        $md .= $this->generatePerformanceAnalysis();
        
        $md .= "\n---\n";
        $md .= "*Generated on " . date('c') . "*\n";
        
        return $md;
    }
    
    private function generatePerformanceAnalysis() {
        $details = $this->testResults['details'];
        if (empty($details)) {
            return "No performance data available.\n";
        }
        
        $durations = [];
        foreach ($details as $test) {
            if ($test['duration'] > 0) {
                $durations[] = [
                    'name' => $test['name'],
                    'duration' => $test['duration']
                ];
            }
        }
        
        if (empty($durations)) {
            return "No duration data available.\n";
        }
        
        // Sort by duration (slowest first)
        usort($durations, function($a, $b) {
            return $b['duration'] <=> $a['duration'];
        });
        
        $avgDuration = array_sum(array_column($durations, 'duration')) / count($durations);
        $slowTests = array_filter($durations, function($test) use ($avgDuration) {
            return $test['duration'] > $avgDuration * 2;
        });
        
        $md = "**Average Test Duration:** " . round($avgDuration, 2) . "s\n\n";
        
        $md .= "**Slowest Tests:**\n";
        $topSlow = array_slice($durations, 0, 5);
        foreach ($topSlow as $test) {
            $md .= "- {$test['name']}: {$test['duration']}s\n";
        }
        $md .= "\n";
        
        if (!empty($slowTests)) {
            $md .= "**⚠️ Performance Concerns (> " . round($avgDuration * 2, 2) . "s):**\n";
            foreach ($slowTests as $test) {
                $md .= "- {$test['name']}: {$test['duration']}s\n";
            }
            $md .= "\n";
        } else {
            $md .= "**✅ No performance concerns detected.**\n\n";
        }
        
        return $md;
    }
    
    private function printSummary() {
        $summary = $this->testResults['summary'];
        $successRate = $summary['total'] > 0 ? 
            round(($summary['passed'] / $summary['total']) * 100) : 0;
        
        echo "\n" . str_repeat('=', 60) . "\n";
        echo "📊 TEST EXECUTION SUMMARY\n";
        echo str_repeat('=', 60) . "\n";
        echo "Suite: {$this->testResults['suite']}\n";
        echo "Duration: {$this->testResults['duration']}s\n";
        echo "Total Tests: {$summary['total']}\n";
        echo "✅ Passed: {$summary['passed']}\n";
        echo "❌ Failed: {$summary['failed']}\n";
        echo "⏭️ Skipped: {$summary['skipped']}\n";
        echo "Success Rate: {$successRate}%\n";
        
        if (!empty($summary['errors'])) {
            echo "\n🚨 ERRORS:\n";
            foreach ($summary['errors'] as $index => $error) {
                $testName = isset($error['test']) ? $error['test'] : 'Unknown';
                $errorMsg = isset($error['error']) ? $error['error'] : 
                           (isset($error['message']) ? $error['message'] : 'Unknown error');
                echo ($index + 1) . ". {$testName}: {$errorMsg}\n";
            }
        }
        
        echo "\n";
        if ($successRate >= 90) {
            echo "🎉 EXCELLENT!\n";
        } elseif ($successRate >= 75) {
            echo "✅ GOOD\n";
        } elseif ($successRate >= 50) {
            echo "⚠️ NEEDS IMPROVEMENT\n";
        } else {
            echo "🚨 CRITICAL\n";
        }
        echo str_repeat('=', 60) . "\n";
    }
}