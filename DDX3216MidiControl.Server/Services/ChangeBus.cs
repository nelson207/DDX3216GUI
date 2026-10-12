using MidiInterface.Models;
using System.Threading.Channels;

namespace MidiInterface.Services
{
    public enum ChangeSource
    {
        /// <summary>From a WebSocket client: goes to MIDI OUT and other clients.</summary>
        Client,
        /// <summary>From the console (MIDI IN): goes to all clients.</summary>
        Midi,
    }

    /// <param name="Link">Apply stereo-pair linking (false for batches that already contain both
    /// channels explicitly, e.g. a scene recall or the copy made when pairing).</param>
    public record ChangeBatch(BehringerChange[] Changes, ChangeSource Source, Guid? OriginClient, bool Link = true);

    /// <summary>
    /// Single ordered queue for every parameter change. Producers (WebSocket receive loops,
    /// the ALSA input thread) only enqueue; <see cref="ChangeDispatcher"/> is the only consumer,
    /// so state updates and broadcasts happen in arrival order.
    /// </summary>
    public sealed class ChangeBus
    {
        private readonly Channel<ChangeBatch> _channel = Channel.CreateUnbounded<ChangeBatch>(
            new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

        public ChannelReader<ChangeBatch> Reader => _channel.Reader;

        public bool Publish(BehringerChange[] changes, ChangeSource source, Guid? originClient = null, bool link = true)
            => changes.Length > 0 && _channel.Writer.TryWrite(new ChangeBatch(changes, source, originClient, link));
    }
}
