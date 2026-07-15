import { MockComplianceProvider } from './mock-provider';

describe('MockComplianceProvider', () => {
  const p = new MockComplianceProvider();

  it('clears a normal customer', async () => {
    const res = await p.screenCustomer({ tenantId: 't1', customerReference: 'c1', country: 'KH' });
    expect(res.decision).toBe('CLEAR');
  });

  it('blocks a sanctioned jurisdiction', async () => {
    const res = await p.screenCustomer({ tenantId: 't1', customerReference: 'c2', country: 'KP' });
    expect(res.decision).toBe('BLOCKED');
    expect(res.reasons).toContain('sanctioned_jurisdiction');
  });

  it('opens a compliance case', async () => {
    const res = await p.createCase({ tenantId: 't1', subjectReference: 'w1', reason: 'test', severity: 'HIGH' });
    expect(res.status).toBe('OPEN');
  });
});
