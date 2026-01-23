describe('legacySaveSeeding', () => {
    it('includes currency balances from v1 seed profiles', async () => {
        const { getLegacyV1SeedItems } = await import('../src/utils/legacySaveSeeding');
        const items = getLegacyV1SeedItems('minimal');
        const dUSDEntry = items.find((item) => item.v1Name === 'dUSD');

        expect(dUSDEntry).toEqual(
            expect.objectContaining({
                v1Id: 24,
                v1Name: 'dUSD',
                v3Name: 'dUSD',
            })
        );
    });
});
