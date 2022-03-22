import {
	isPartialTrack,
	isTrack,
	Kirishima,
	KirishimaNode,
	KirishimaPartialTrack,
	KirishimaPlayerOptions,
	KirishimaTrack,
	LoadTrackResponse,
	Structure
} from '@kirishima/core';

import { KirishimaQueueTracks } from './KirishimaQueueTracks';
import { ConnectionState, KirishimaVoiceConnection } from './KirishimaVoiceConnection';

export class KirishimaPlayer extends Structure.get('KirishimaPlayer') {
	public queue = new KirishimaQueueTracks();
	public loopType: LoopType = LoopType.None;
	public connection = new KirishimaVoiceConnection(this);

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
		resolvePartialTrack(track: KirishimaPartialTrack): Promise<LoadTrackResponse<KirishimaTrack>>;
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
