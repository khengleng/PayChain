import { apiGet } from '../../lib/api';
import { Unavailable } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface AbacAttribute {
  key: string;
  type: string;
  description: string;
  enforced: boolean;
}

interface AccessModel {
  permissions: string[];
  roles: { role: string; permissions: string[]; permissionCount: number }[];
  me: { role: string; permissions: string[]; attributes: Record<string, unknown> };
  abac: { attributes: AbacAttribute[] };
}

export default async function AccessControlPage() {
  const model = await apiGet<AccessModel>('/admin/access-model');

  if (!model) return <Unavailable perm="admin session" />;

  return (
    <>
      <h1>Access Control</h1>
      <p className="subtitle">
        RBAC role → permission matrix and ABAC attribute policy, served live from the code that
        enforces them · authorization always checks a permission, never a role name
      </p>

      {model.me.role === 'SUPER_ADMIN' && (
        <div className="banner ready">
          <div className="big">Super admin role</div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>
            This role currently carries the full permission catalog and is the only role intended
            to own end-to-end control-plane alignment across partner onboarding, trustee
            verification, readiness, emergency controls, and admin lifecycle management.
          </div>
        </div>
      )}

      <div className="section-title">Your access</div>
      <div className="form-card" style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="login-label">Role</div>
            <span className="pill PASSED">{model.me.role}</span>
          </div>
          <div>
            <div className="login-label">Permissions</div>
            <div>{model.me.permissions.length} of {model.permissions.length}</div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="login-label">ABAC attributes</div>
            <span className="mono" style={{ fontSize: 12 }}>
              {Object.keys(model.me.attributes).length > 0
                ? JSON.stringify(model.me.attributes)
                : '{} — unscoped (all tenants)'}
            </span>
          </div>
        </div>
      </div>

      <div className="section-title">RBAC · role → permission matrix</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0 }}>Permission</th>
              {model.roles.map((r) => (
                <th key={r.role} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  {r.role.replace('_ADMIN', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.permissions.map((p) => (
              <tr key={p}>
                <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{p}</td>
                {model.roles.map((r) => (
                  <td key={r.role} style={{ textAlign: 'center' }}>
                    {r.permissions.includes(p) ? (
                      <span style={{ color: '#3fb950' }} title={`${r.role} has ${p}`}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--muted)', opacity: 0.35 }}>·</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">ABAC · attribute policy</div>
      <p className="subtitle" style={{ fontSize: 13, marginTop: 0 }}>
        RBAC decides whether an admin <em>has</em> a permission. ABAC decides whether they may use
        it on <em>this</em> resource. An admin scoped to tenant A holding{' '}
        <span className="mono">wallet:freeze</span> is refused on a tenant-B wallet.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Attribute</th><th>Type</th><th>Meaning</th><th>Enforced</th></tr>
          </thead>
          <tbody>
            {model.abac.attributes.map((a) => (
              <tr key={a.key}>
                <td className="mono">{a.key}</td>
                <td className="mono" style={{ fontSize: 12 }}>{a.type}</td>
                <td style={{ color: 'var(--muted)' }}>{a.description}</td>
                <td>
                  <span className={`pill ${a.enforced ? 'PASSED' : 'BLOCKED'}`}>
                    {a.enforced ? 'Enforced' : 'Not enforced'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="subtitle" style={{ fontSize: 12 }}>
        Attributes marked <strong>Not enforced</strong> are read by the policy but no resource
        currently supplies a value to compare against, so they never affect a decision. They are
        shown rather than hidden so this page is not read as a stronger claim than the code makes.
      </p>
    </>
  );
}
