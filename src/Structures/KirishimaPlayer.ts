import {
	isPartialTrack,
	isTrack,
	Kirishima,
	KirishimaNode,
	KirishimaPartialTrack,
	KirishimaPlayerOptions,
	KirishimaTrack,
	Structure
} from '@kirishima/core';
import { LoadTrackResponse, WebsocketOpEnum } from 'lavalink-api-types';

import { KirishimaQueueTracks } from './KirishimaQueueTracks';
import { ConnectionState, KirishimaVoiceConnection } from './KirishimaVoiceConnection';

export class KirishimaPlayer extends Structure.get('KirishimaPlayer') {
	public queue = new KirishimaQueueTracks();
	public loopType: LoopType = LoopType.None;
	public playing = false;
	public connection = new KirishimaVoiceConnection(this);
	public paused = false;

	public constructor(options: KirishimaPlayerOptions, kirishima: Kirishima, node: KirishimaNode) {
		super(options, kirishima, node);
	}

	public setLoop(type: LoopType) {
		this.loopType = type;
		return this;
	}

	public async connect() {
		this.connection.state = ConnectionState.Connecting;
		const player = await super.connect();
		this.connection.state = ConnectionState.Connected;
		return player;
	}

	public async disconnect() {
		const player = await super.disconnect();
		this.connection.state = ConnectionState.Disconnected;
		return player;
	}

	public resolvePartialTrack(track: KirishimaPartialTrack) {
		return this.kirishima.resolveTracks(`${track.info.title} - ${track.info.author ? track.info.author : ''}`);
	}

	public async setVolume(volume: number) {
		if (volume < 0 || volume > 500) throw new Error('Volume must be between 0 and 500');
		this.filters.volume = volume / 100;
		await this.node.ws.send({
			op: WebsocketOpEnum.FILTERS,
			guildId: this.options.guildId,
			...this.filters
		});
	}

	public async setPaused(paused: boolean) {
		await this.node.ws.send({
			op: WebsocketOpEnum.PAUSE,
			guildId: this.options.guildId,
			pause: paused
		});
		this.paused = paused;
		return this;
	}

	public async seekTo(position: number) {
		if (this.playing) {
			await this.node.ws.send({
				op: WebsocketOpEnum.SEEK,
				guildId: this.options.guildId,
				position
			});
			return this;
		}
		throw new Error('There are no playing track currently.');
	}

	public async playTrack(track?: KirishimaTrack | KirishimaPartialTrack | string) {
		if (track && isTrack(track)) {
			return super.playTrack(track);
		}

		if (this.queue.current && isTrack(this.queue.current)) {
			return super.playTrack(this.queue.current);
		}

		if (track && isPartialTrack(track)) {
			const resolved = await this.resolvePartialTrack(track);
			if (resolved.tracks.length) {
				return super.playTrack(resolved.tracks[0].track);
			}
		}

		if (this.queue.current && isPartialTrack(this.queue.current)) {
			const resolved = await this.resolvePartialTrack(this.queue.current);
			if (resolved.tracks.length) {
				return super.playTrack(resolved.tracks[0].track);
			}
		}

		throw new Error('No track to play');
	}

	public get connected() {
		return Boolean(this.voiceServer && this.voiceState?.channel_id && this.connection.state === ConnectionState.Connected);
	}
}

declare module '@kirishima/core' {
	export interface KirishimaPlayer {
		connection: KirishimaVoiceConnection;
		paused: boolean;
		playing: boolean;
		queue: KirishimaQueueTracks;
		loopType: LoopType;
		setLoop(type: LoopType): this;
		resolvePartialTrack(track: KirishimaPartialTrack): Promise<LoadTrackResponse>;
		setPaused(paused: boolean): Promise<this>;
		seekTo(position: number): Promise<this>;
		playTrack(track?: KirishimaTrack | KirishimaPartialTrack | string): Promise<this>;
		get connected(): boolean;
	}
}

export enum LoopType {
	None = 0,
	Track = 1,
	Queue = 2
}
