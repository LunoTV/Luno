(function(global){
  'use strict';

  const Core = global.LunoCore;
  const Adapter = global.LunoAdapter;
  const results = [];

  const test = (name, fn) => {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (error) {
      results.push({ name, ok: false, error: String(error?.message || error) });
    }
  };

  const assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed');
  };

  test('core exists', () => assert(Core && Core.version, 'LunoCore is missing'));
  test('adapter exists', () => assert(Adapter && Adapter.version, 'LunoAdapter is missing'));

  test('router push/back', () => {
    Core.router.reset('home');
    Core.router.go('search');
    assert(Core.router.current() === 'search', 'router did not navigate');
    Core.router.back();
    assert(Core.router.current() === 'home', 'router did not go back');
  });

  test('storage round trip', () => {
    const key = '__luno_core_test__';
    Core.storage.set(key, { ok: true, n: 7 });
    const value = Core.storage.get(key);
    assert(value && value.ok === true && value.n === 7, 'storage round trip failed');
    Core.storage.remove(key);
    assert(Core.storage.get(key) === null, 'storage remove failed');
  });

  test('content normalization', () => {
    const item = Adapter.content.normalize({
      tmdb_id: 123,
      name: 'Test',
      vote_average: 8.4,
      release_date: '2026-01-01'
    });
    assert(item.id === '123', 'id normalization failed');
    assert(item.title === 'Test', 'title normalization failed');
    assert(item.rating === 8.4, 'rating normalization failed');
    assert(item.year === '2026', 'year normalization failed');
  });

  test('source registry', () => {
    Adapter.source.register('__test__', {
      async ping(payload) { return { pong: payload.value }; }
    });
    assert(Adapter.source.list().includes('__test__'), 'source was not registered');
    Adapter.source.unregister('__test__');
    assert(!Adapter.source.list().includes('__test__'), 'source was not removed');
  });

  global.LunoCoreTests = {
    ok: results.every(item => item.ok),
    results
  };

  Core.emit('tests', global.LunoCoreTests);

})(window);
