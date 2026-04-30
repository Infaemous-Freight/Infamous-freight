const { buildJestArgs } = require('../scripts/run-jest.cjs') as {
  buildJestArgs: (rawArgs: string[]) => string[];
};

describe('run-jest wrapper', () => {
  it('adds --runInBand when no explicit runInBand flag is provided', () => {
    expect(buildJestArgs(['--coverage'])).toEqual(['--runInBand', '--coverage']);
  });

  it('does not add --runInBand when explicitly enabled', () => {
    expect(buildJestArgs(['--runInBand', '--coverage'])).toEqual(['--runInBand', '--coverage']);
  });

  it('does not add --runInBand when explicitly disabled', () => {
    expect(buildJestArgs(['--runInBand=false', '--coverage'])).toEqual(['--runInBand=false', '--coverage']);
  });

  it('does not add --runInBand when shorthand -i is used', () => {
    expect(buildJestArgs(['-i', '--coverage'])).toEqual(['-i', '--coverage']);
  });

  it('does not add --runInBand when explicitly set to true', () => {
    expect(buildJestArgs(['--runInBand=true', '--coverage'])).toEqual(['--runInBand=true', '--coverage']);
  });

  it('strips npm passthrough separator', () => {
    expect(buildJestArgs(['--', '--coverage'])).toEqual(['--runInBand', '--coverage']);
  });
});
