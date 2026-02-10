using MidiInterface.Models;
using System.Collections.Concurrent;

namespace MidiInterface.Services
{
    public sealed class BehringerStateStoreService
    {
        private readonly ConcurrentDictionary<ModuleParamKey, double> _values = new();

        public void Set(BehringerChange change)
            => _values[new ModuleParamKey(change.Module, change.Param)] = change.Value;

        public void SetMany(IEnumerable<BehringerChange> changes)
        {
            foreach (var c in changes)
                _values[new ModuleParamKey(c.Module, c.Param)] = c.Value;
        }

        public bool TryGet(int module, int param, out double value)
            => _values.TryGetValue(new ModuleParamKey(module, param), out value);

        public IReadOnlyDictionary<ModuleParamKey, double> Snapshot()
            => new Dictionary<ModuleParamKey, double>(_values);
    }
}
