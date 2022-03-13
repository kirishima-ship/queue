import { isTrack, Kirishima, KirishimaNode, KirishimaPartialTrack, KirishimaPlayerOptions, KirishimaTrack, Structure } from '@kirishima/core';
import type { LoadTrackResponse } from 'lavalink-api-types';

import { KirishimaQueueTracks } from './KirishimaQueueTracks';

export class KirishimaPlayer extends Structure.get('KirishimaPlayer') {
	public queue = new KirishimaQueueTracks();
	public loopType: LoopType = LoopType.None;
	public playing = false;

	public constructor(options: KirishimaPlayerOptions, kirishima: Kirishima, node: KirishimaNode) {
		super(options, kirishima, node);
	}

	public setLoop(type: LoopType) {
		this.loopType = type;
		return this;
	}

	public resolvePartialTrack(track: KirishimaPartialTrack) {
		return this.kirishima.resolveTracks(`${track.info.title} - ${track.info.author ? track.info.author : ''}`);
	}

	public async playTrack(track?: KirishimaTrack | string) {
		if (track && isTrack(track)) {
			return super.playTrack(track);
		}

		if (this.queue.current && isTrack(this.queue.current)) {
			return super.playTrack(this.queue.current);
		}
		throw new Error('No track to play');
	}

	public get connected() {
		return Boolean(this.voiceServer && this.voiceState);
	}
}

declare module '@kirishima/core' {
	export interface KirishimaPlayer {
		playing: boolean;
		queue: KirishimaQueueTracks;
		loopType: LoopType;
		setLoop(type: LoopType): this;
		resolvePartialTrack(track: KirishimaPartialTrack): Promise<LoadTrackResponse>;
		get connected(): boolean;
	}
}

export enum LoopType {
	None = 0,
	Track = 1,
	Queue = 2
}
