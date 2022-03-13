import { isPartialTrack, Kirishima, KirishimaNode, KirishimaPlugin, Structure } from '@kirishima/core';
import type { Gateway } from '@kirishima/ws';
import { KirishimaPlayer, LoopType } from './KirishimaPlayer';
import {
	TrackEndEventPayload,
	TrackExceptionEventPayload,
	TrackStartEventPayload,
	TrackStuckEventPayload,
	WebSocketClosedEventPayload,
	WebSocketTypeEnum
} from 'lavalink-api-types';

export class KirishimaQueue extends KirishimaPlugin {
	public constructor() {
		super({
			name: 'KirishimaQueue'
		});
	}

	public load(kirishima: Kirishima) {
		Structure.extend('KirishimaPlayer', () => KirishimaPlayer);

		kirishima.on('nodeRaw', (node: KirishimaNode, gateway: Gateway, message: NodeTrackRawMessage) =>
			this.handleNodeRaw(node, gateway, message, kirishima)
		);
	}

	private handleNodeRaw(_node: KirishimaNode, _gateway: Gateway, message: NodeTrackRawMessage, kirishima: Kirishima) {
		const player = kirishima.players!.get(message.guildId);
		if (!player) return;

		if (message.type === WebSocketTypeEnum.TrackEndEvent) {
			void this.trackEnd(player, message, kirishima);
		}

		if (message.type === WebSocketTypeEnum.TrackExceptionEvent) {
			this.trackException(player, message, kirishima);
		}

		if (message.type === WebSocketTypeEnum.TrackStuckEvent) {
			this.trackStuck(player, message, kirishima);
		}

		if (message.type === WebSocketTypeEnum.TrackStartEvent) {
			this.trackStart(player, message, kirishima);
		}
	}

	private async trackEnd(player: KirishimaPlayer, message: TrackEndEventPayload, kirishima: Kirishima) {
		if (message.reason === 'REPLACED') return;
		try {
			player.playing = false;
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
				kirishima.emit('queueEnd', player, player);
			}

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
			kirishima.emit('queueEnd', player, player);
		} catch (e) {
			kirishima.emit('playerError', player, e);
		}
	}

	private trackException(player: KirishimaPlayer, message: TrackExceptionEventPayload, kirishima: Kirishima) {
		kirishima.emit('trackException', player, player.queue.current, message);
	}

	private trackStuck(player: KirishimaPlayer, message: TrackStuckEventPayload, kirishima: Kirishima) {
		kirishima.emit('trackStuck', player, player.queue.current, message);
	}

	private trackStart(player: KirishimaPlayer, message: TrackStartEventPayload, kirishima: Kirishima) {
		player.playing = true;
		kirishima.emit('trackStart', player, player.queue.current, message);
	}
}

export type NodeTrackRawMessage =
	| TrackStartEventPayload
	| TrackEndEventPayload
	| TrackExceptionEventPayload
	| TrackStuckEventPayload
	| WebSocketClosedEventPayload;
