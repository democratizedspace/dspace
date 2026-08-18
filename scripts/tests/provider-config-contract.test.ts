import { describe, expect, it } from 'vitest';

import {
  providerConfigContractFrom,
  validateProviderConfig,
} from '../../frontend/e2e/remote-chat-smoke-contract';

const tokenPlaceExpectations = {
  provider: 'token-place' as const,
  tokenPlaceOrigin: 'https://token.place',
  tokenPlaceModel: 'llama-3.1-8b-instruct',
};
const finalized311Config = {
  tokenPlace: {
    url: 'https://token.place/api/v1',
    model: 'llama-3.1-8b-instruct',
  },
};

describe('remote chat provider config contracts', () => {
  it('uses the strict current contract by default and validates an exact provider', () => {
    expect(providerConfigContractFrom(undefined)).toBe(
      'explicit-default-provider-v1'
    );
    expect(() =>
      validateProviderConfig(
        'explicit-default-provider-v1',
        {
          ...finalized311Config,
          chat: { defaultProvider: 'token-place' },
        },
        tokenPlaceExpectations
      )
    ).not.toThrow();
  });

  it.each([
    ['missing', finalized311Config],
    [
      'mismatched',
      { ...finalized311Config, chat: { defaultProvider: 'openai' } },
    ],
  ])(
    'strict current contract rejects a %s default provider',
    (_name, config) => {
      expect(() =>
        validateProviderConfig(
          'explicit-default-provider-v1',
          config,
          tokenPlaceExpectations
        )
      ).toThrow('LIVE_DEFAULT_PROVIDER_DISAGREEMENT');
    }
  );

  it('accepts the finalized 3.1.1-shaped legacy config with exact token.place coordinates', () => {
    expect(() =>
      validateProviderConfig(
        'legacy-no-default-provider-v1',
        finalized311Config,
        tokenPlaceExpectations
      )
    ).not.toThrow();
  });

  it.each([
    [
      'explicit provider claim',
      { ...finalized311Config, chat: { defaultProvider: 'token-place' } },
    ],
    [
      'origin drift',
      {
        tokenPlace: {
          ...finalized311Config.tokenPlace,
          url: 'https://other.example/api/v1',
        },
      },
    ],
    [
      'model drift',
      {
        tokenPlace: {
          ...finalized311Config.tokenPlace,
          model: 'other-model',
        },
      },
    ],
    ['malformed chat', { ...finalized311Config, chat: null }],
    ['malformed token.place', { tokenPlace: null }],
  ])('legacy contract rejects %s', (_name, config) => {
    expect(() =>
      validateProviderConfig(
        'legacy-no-default-provider-v1',
        config,
        tokenPlaceExpectations
      )
    ).toThrow();
  });

  it('rejects an invalid or empty selector without inspecting config', () => {
    expect(() => providerConfigContractFrom('automatic')).toThrow(
      'must select a supported provider config contract'
    );
    expect(() => providerConfigContractFrom('')).toThrow(
      'must select a supported provider config contract'
    );
  });
});
