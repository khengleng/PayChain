import { PATH_METADATA } from '@nestjs/common/constants';
import { LoyaltyController } from './loyalty.controller';
import { StablecoinWorkflowController } from '../stablecoin/workflow.controller';

/**
 * Route-ownership guard for the two "earn" products, which are NOT interchangeable:
 *
 *  - POST /assets/{assetId}/earn      → LoyaltyController: rules engine, computes points from
 *                                       spend, records a Transaction, emits asset.issued.
 *  - POST /stablecoins/{assetId}/earn → StablecoinWorkflowController: reserve-backed mint of a
 *                                       caller-computed amount, returns a StablecoinMintRequest.
 *
 * These once collided on /assets/{assetId}/earn. Nest resolves a duplicate path by registration
 * order, and LoyaltyModule is imported before StablecoinModule in app.module.ts — so the mint was
 * silently unreachable while every unit test still passed. Assert the full paths stay distinct.
 */
function routeOf(controller: object, method: string): string {
  const prefix = (Reflect.getMetadata(PATH_METADATA, controller) as string | undefined) ?? '';
  const handler = (controller as { prototype: Record<string, object | undefined> }).prototype[method];
  if (!handler) throw new Error(`${method}() no longer exists on the controller`);
  const path = (Reflect.getMetadata(PATH_METADATA, handler) as string | undefined) ?? '';
  return `/${[prefix, path].filter((s) => s && s !== '/').join('/')}`;
}

describe('earn route ownership', () => {
  it('gives the loyalty rules engine /assets/:assetId/earn', () => {
    expect(routeOf(LoyaltyController, 'earn')).toBe('/assets/:assetId/earn');
  });

  it('hosts the reserve-backed mint on its own path, not the loyalty one', () => {
    expect(routeOf(StablecoinWorkflowController, 'earn')).toBe('/stablecoins/:assetId/earn');
  });

  it('never lets the two earn handlers share a path', () => {
    expect(routeOf(StablecoinWorkflowController, 'earn')).not.toBe(routeOf(LoyaltyController, 'earn'));
  });
});
