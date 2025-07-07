const child = require('child_process');
jest.mock('child_process');

describe('run-tests OS detection', () => {
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('calls PowerShell on Windows', () => {
    jest.spyOn(require('os'), 'platform').mockReturnValue('win32');
    jest.isolateModules(() => {
      require('../../run-tests');
    });
    expect(child.execSync).toHaveBeenCalledWith(expect.stringMatching(/prepare-pr\.ps1/), expect.any(Object));
  });
  it('calls Bash on Unix', () => {
    jest.spyOn(require('os'), 'platform').mockReturnValue('linux');
    jest.isolateModules(() => {
      require('../../run-tests');
    });
    expect(child.execSync).toHaveBeenCalledWith(expect.stringMatching(/prepare-pr\.sh/), expect.any(Object));
  });
  afterAll(() => exitSpy.mockRestore());
});
