import { Kirishima, KirishimaNode, KirishimaPartialTrack, KirishimaPlayerOptions, Structure } from '@kirishima/core';
import type { LoadTrackResponse } from 'lavalink-api-types';

import { KirishimaQueueTracks } from './KirishimaQueueTracks';

export class KirishimaPlayer extends Structure.get('KirishimaPlayer') {
	public queue = new KirishimaQueueTracks();
	public loopType: LoopType = LoopType.None;

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
}

declare module '@kirishima/core' {
	export interface KirishimaPlayer {
		queue: KirishimaQueueTracks;
		loopType: LoopType;
		setLoop(type: LoopType): this;
		resolvePartialTrack(track: KirishimaPartialTrack): Promise<LoadTrackResponse>;
	}
}

export enum LoopType {
	None = 0,
	Track = 1,
	Queue = 2
}
