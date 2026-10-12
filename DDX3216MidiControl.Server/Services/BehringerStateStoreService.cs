using MidiInterface.Models;
using System.Collections.Concurrent;

namespace MidiInterface.Services
{
    /// <summary>
    /// Last known value of every parameter. Changed keys are tracked so
    /// <see cref="LiveStatePersistence"/> can write them to the database in the background.
    /// </summary>
    public sealed class BehringerStateStoreService
    {
        private readonly ConcurrentDictionary<ModuleParamKey, double> _values = new();
        private readonly ConcurrentDictionary<ModuleParamKey, byte> _dirty = new();

        public void SetMany(IEnumerable<BehringerChange> changes)
        {
            foreach (var c in changes)
            {
                var key = new ModuleParamKey(c.Module, c.Param);
                _values[key] = c.Value;
                _dirty[key] = 0;
            }
        }

        /// <summary>Initial load from the database (does not mark anything dirty).</summary>
        public void Load(IEnumerable<KeyValuePair<ModuleParamKey, double>> values)
        {
            foreach (var kv in values) _values[kv.Key] = kv.Value;
        }

        public IReadOnlyDictionary<ModuleParamKey, double> Snapshot()
            => new Dictionary<ModuleParamKey, double>(_values);

        /// <summary>Marks keys as changed again (e.g. after a failed save) without touching their values.</summary>
        public void MarkDirty(IEnumerable<ModuleParamKey> keys)
        {
            foreach (var key in keys) _dirty[key] = 0;
        }

        /// <summary>Returns and clears the keys changed since the last call, with their current values.</summary>
        public List<KeyValuePair<ModuleParamKey, double>> TakeDirty()
        {
            var result = new List<KeyValuePair<ModuleParamKey, double>>();
            foreach (var key in _dirty.Keys)
            {
                if (_dirty.TryRemove(key, out _) && _values.TryGetValue(key, out var v))
                    result.Add(new(key, v));
            }
            return result;
        }
    }
}
