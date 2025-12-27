#!/usr/bin/env node
/**
 * Phase 7B Integration Test
 *
 * Automated validation of widget ↔ backend contract compliance.
 * Tests backend endpoints directly (widget testing requires browser).
 *
 * Usage: node specs/phase-7b/integration-test.js
 */

const BACKEND_URL = 'http://localhost:8000';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passCount = 0;
let failCount = 0;

function log(color, symbol, message) {
  console.log(`${color}${symbol}${COLORS.reset} ${message}`);
}

function pass(message) {
  passCount++;
  log(COLORS.green, '✓', message);
}

function fail(message) {
  failCount++;
  log(COLORS.red, '✗', message);
}

function info(message) {
  log(COLORS.blue, 'ℹ', message);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test: Health Check
async function testHealthCheck() {
  info('Test 1: Health Check');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();

    if (response.status === 200 && data.status === 'ok') {
      pass('Health check passed');
      return true;
    } else {
      fail(`Health check failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    fail(`Health check failed: ${error.message}`);
    return false;
  }
}

// Test: Valid Request
async function testValidRequest() {
  info('Test 2: Valid Request (Happy Path)');
  try {
    const request = {
      message: 'What is embodied AI?',
      context: {
        mode: 'browse',
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      tier: 'anonymous',
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // Validate response structure
    if (!data.answer) {
      fail('Response missing "answer" field');
      return false;
    }
    if (!Array.isArray(data.sources)) {
      fail('Response missing "sources" array');
      return false;
    }
    if (!data.metadata) {
      fail('Response missing "metadata" field');
      return false;
    }

    // Validate metadata fields
    const requiredMetadata = ['model', 'tokens_used', 'retrieval_time_ms', 'generation_time_ms', 'total_time_ms'];
    for (const field of requiredMetadata) {
      if (!(field in data.metadata)) {
        fail(`Response metadata missing "${field}" field`);
        return false;
      }
    }

    // Validate sources structure
    if (data.sources.length > 0) {
      const source = data.sources[0];
      const requiredSourceFields = ['id', 'title', 'url', 'excerpt', 'score'];
      for (const field of requiredSourceFields) {
        if (!(field in source)) {
          fail(`Source missing "${field}" field`);
          return false;
        }
      }
    }

    pass('Valid request returned correct response structure');
    return true;
  } catch (error) {
    fail(`Valid request failed: ${error.message}`);
    return false;
  }
}

// Test: Empty Message (should fail validation)
async function testEmptyMessage() {
  info('Test 3: Empty Message (Validation Error)');
  try {
    const request = {
      message: '',
      context: {
        mode: 'browse',
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      tier: 'anonymous',
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 422 || response.status === 400) {
      pass('Empty message correctly rejected with 4xx error');
      return true;
    } else {
      fail(`Empty message should return 4xx, got ${response.status}`);
      return false;
    }
  } catch (error) {
    fail(`Empty message test failed: ${error.message}`);
    return false;
  }
}

// Test: Message Too Long
async function testMessageTooLong() {
  info('Test 4: Message Too Long (>2000 chars)');
  try {
    const longMessage = 'a'.repeat(2001);
    const request = {
      message: longMessage,
      context: {
        mode: 'browse',
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      tier: 'anonymous',
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 422 || response.status === 400) {
      pass('Long message correctly rejected with 4xx error');
      return true;
    } else {
      fail(`Long message should return 4xx, got ${response.status}`);
      return false;
    }
  } catch (error) {
    fail(`Long message test failed: ${error.message}`);
    return false;
  }
}

// Test: Invalid Session ID
async function testInvalidSessionID() {
  info('Test 5: Invalid Session ID (Not UUID)');
  try {
    const request = {
      message: 'Test message',
      context: {
        mode: 'browse',
        session_id: 'not-a-uuid',
      },
      tier: 'anonymous',
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.status === 422 || response.status === 400) {
      pass('Invalid session ID correctly rejected with 4xx error');
      return true;
    } else {
      fail(`Invalid session ID should return 4xx, got ${response.status}`);
      return false;
    }
  } catch (error) {
    fail(`Invalid session ID test failed: ${error.message}`);
    return false;
  }
}

// Test: Multiple Sequential Requests
async function testSequentialRequests() {
  info('Test 6: Multiple Sequential Requests');
  try {
    const sessionId = '550e8400-e29b-41d4-a716-446655440000';

    for (let i = 1; i <= 3; i++) {
      const request = {
        message: `Test message ${i}`,
        context: {
          mode: 'browse',
          session_id: sessionId,
        },
        tier: 'anonymous',
      };

      const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.status !== 200) {
        fail(`Sequential request ${i} failed with status ${response.status}`);
        return false;
      }

      await sleep(100); // Small delay between requests
    }

    pass('Multiple sequential requests completed successfully');
    return true;
  } catch (error) {
    fail(`Sequential requests test failed: ${error.message}`);
    return false;
  }
}

// Test: CORS Headers
async function testCORS() {
  info('Test 7: CORS Headers');
  try {
    const request = {
      message: 'CORS test',
      context: {
        mode: 'browse',
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      tier: 'anonymous',
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000', // Simulate browser origin
      },
      body: JSON.stringify(request),
    });

    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader) {
      pass(`CORS enabled (allow-origin: ${corsHeader})`);
      return true;
    } else {
      fail('CORS headers not found (may block widget requests)');
      return false;
    }
  } catch (error) {
    fail(`CORS test failed: ${error.message}`);
    return false;
  }
}

// Test: Response Time
async function testResponseTime() {
  info('Test 8: Response Time (<2s)');
  try {
    const start = Date.now();
    const request = {
      message: 'Performance test',
      context: {
        mode: 'browse',
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      tier: 'anonymous',
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    await response.json();
    const duration = Date.now() - start;

    if (duration < 2000) {
      pass(`Response time: ${duration}ms (within 2s threshold)`);
      return true;
    } else {
      fail(`Response time: ${duration}ms (exceeds 2s threshold)`);
      return false;
    }
  } catch (error) {
    fail(`Response time test failed: ${error.message}`);
    return false;
  }
}

// Main Test Runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Phase 7B Integration Test Suite');
  console.log('Backend: ' + BACKEND_URL);
  console.log('='.repeat(60) + '\n');

  // Run tests
  await testHealthCheck();
  await testValidRequest();
  await testEmptyMessage();
  await testMessageTooLong();
  await testInvalidSessionID();
  await testSequentialRequests();
  await testCORS();
  await testResponseTime();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  log(COLORS.green, '✓', `${passCount} passed`);
  if (failCount > 0) {
    log(COLORS.red, '✗', `${failCount} failed`);
  }
  console.log('='.repeat(60) + '\n');

  if (failCount > 0) {
    console.log(`${COLORS.red}❌ Phase 7B Activation: BLOCKED${COLORS.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${COLORS.green}✅ Phase 7B Activation: APPROVED${COLORS.reset}\n`);
    process.exit(0);
  }
}

// Run
runTests().catch(error => {
  fail(`Test runner crashed: ${error.message}`);
  process.exit(1);
});
