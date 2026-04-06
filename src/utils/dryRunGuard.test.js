import { dryRunGuard, buildDryRunMessage } from './dryRunGuard';

describe('dryRunGuard', () => {
  test('calls onDryRun when isDryRun is true', () => {
    const onDryRun = jest.fn();
    const onLive   = jest.fn();

    dryRunGuard({
      isDryRun: true,
      actionLabel: 'XSS Test',
      elementInfo: { name: 'username', type: 'input' },
      payloads: ["<script>alert(1)</script>"],
      onDryRun,
      onLive,
    });

    expect(onDryRun).toHaveBeenCalledTimes(1);
    expect(onLive).not.toHaveBeenCalled();
  });

  test('calls onLive when isDryRun is false', () => {
    const onDryRun = jest.fn();
    const onLive   = jest.fn();

    dryRunGuard({
      isDryRun: false,
      actionLabel: 'SQL Injection Test',
      elementInfo: { name: 'password', type: 'input' },
      payloads: ["' OR '1'='1"],
      onDryRun,
      onLive,
    });

    expect(onLive).toHaveBeenCalledTimes(1);
    expect(onDryRun).not.toHaveBeenCalled();
  });

  test('does not throw when callbacks are not provided', () => {
    expect(() =>
      dryRunGuard({
        isDryRun: true,
        actionLabel: 'Test',
        elementInfo: { name: 'field', type: 'input' },
        payloads: [],
      })
    ).not.toThrow();
  });
});

describe('buildDryRunMessage', () => {
  test('includes action label in message', () => {
    const msg = buildDryRunMessage('XSS Test', { name: 'search' }, ['<script>']);
    expect(msg).toContain('XSS Test');
  });

  test('includes target field name', () => {
    const msg = buildDryRunMessage('Test', { name: 'username' }, []);
    expect(msg).toContain('username');
  });

  test('shows max 3 payloads and overflow count', () => {
    const payloads = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const msg = buildDryRunMessage('Test', { name: 'f' }, payloads);
    expect(msg).toContain('+2 more');
  });

  test('falls back to type when name is missing', () => {
    const msg = buildDryRunMessage('Test', { type: 'textarea' }, []);
    expect(msg).toContain('textarea');
  });
});
