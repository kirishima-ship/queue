import { isPartialTrack, Kirishima, KirishimaNodeOptions, Structure } from '@kirishima/core';
import type { Gateway } from '@kirishima/ws';
import {
	TrackEndEventPayload,
	TrackExceptionEventPayload,
	TrackStartEventPayload,
	TrackStuckEventPayload,
	WebSocketClosedEventPayload,
	WebSocketTypeEnum
} from 'lavalink-api-types';
import { KirishimaPlayer, LoopType } from './KirishimaPlayer';
export class KirishimaNode extends Structure.get('KirishimaNode') {
	public constructor(options: KirishimaNodeOptions, kirishima: Kirishima) {
		super(options, kirishima);
		kirishima.on('nodeRaw', this.handleNodeRaw.bind(this));
	}

	private handleNodeRaw(_node: KirishimaNode, _gateway: Gateway, message: NodeTrackRawMessage) {
		const player = this.kirishima.players!.get(message.guildId);
		if (!player) return;

		if (message.type === WebSocketTypeEnum.TrackEndEvent) {
			void this.trackEnd(player, message);
		}

		if (message.type === WebSocketTypeEnum.TrackExceptionEvent) {
			this.trackException(player, message);
		}

		if (message.type === WebSocketTypeEnum.TrackStuckEvent) {
			this.trackStuck(player, message);
		}

		if (message.type === WebSocketTypeEnum.TrackStartEvent) {
			this.trackStart(player, message);
		}
	}

	private async trackEnd(player: KirishimaPlayer, message: TrackEndEventPayload) {
		if (message.reason === 'REPLACED') return;
		try {
			if (player.loopType === LoopType.Track) {
				if (isPartialTrack(player.queue.current) && player.queue.current) {
					const track = await player.resolvePartialTrack(player.queue.current);
					if (track.tracks.length) {
						await player.playTrack(track.tracks[0].track);
						return;
					}
					await player.stopTrack();
					return;
				}

				if (player.queue.current) {
					await player.playTrack(player.queue.current);
					return;
				}
			}

			if (player.queue.current && player.loopType === LoopType.Queue) {
				player.queue.add(player.queue.current);
				player.queue.previous = player.queue.current;
				player.queue.current = player.queue.shift() ?? null;

				if (player.queue.current) {
					if (isPartialTrack(player.queue.current)) {
						const track = await player.resolvePartialTrack(player.queue.current);
						if (track.tracks.length) {
							await player.playTrack(track.tracks[0].track);
							return;
						}
						await player.stopTrack();
						return;
					}

					await player.playTrack(player.queue.current!);
					return;
				}
				this.kirishima.emit('queueEnd', player, player);
			}
		} catch (e) {
			this.kirishima.emit('playerError', player, e);
		}
	}

	private trackException(player: KirishimaPlayer, message: TrackExceptionEventPayload) {
		this.kirishima.emit('trackException', player, player.queue.current, message);
	}

	private trackStuck(player: KirishimaPlayer, message: TrackStuckEventPayload) {
		this.kirishima.emit('trackStuck', player, player.queue.current, message);
	}

	private trackStart(player: KirishimaPlayer, message: TrackStartEventPayload) {
		this.kirishima.emit('trackStart', player, player.queue.current, message);
	}
}

export type NodeTrackRawMessage =
	| TrackStartEventPayload
	| TrackEndEventPayload
	| TrackExceptionEventPayload
	| TrackStuckEventPayload
	| WebSocketClosedEventPayload;
