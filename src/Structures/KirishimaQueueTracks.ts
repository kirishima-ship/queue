/* eslint-disable no-negated-condition */
import { isPartialTrack, isTrack, KirishimaPartialTrack, KirishimaTrack } from '@kirishima/core';

export class KirishimaQueueTracks extends Array<KirishimaPartialTrack | KirishimaTrack> {
	public current: KirishimaPartialTrack | KirishimaTrack | null = null;
	public previous: KirishimaPartialTrack | KirishimaTrack | null = null;

	public add(trackOrTracks: KirishimaPartialTrack | KirishimaTrack | (KirishimaPartialTrack | KirishimaTrack)[]) {
		if (!ValidateValidTracks(trackOrTracks)) throw new Error('Track(s) must be a "KirishimaPartialTrack" or "KirishimaTrack".');

		if (!this.current) {
			if (!Array.isArray(trackOrTracks)) {
				this.current = trackOrTracks;
				return;
			}
			this.current = (trackOrTracks = [...trackOrTracks]).shift()!;
		}

		if (Array.isArray(trackOrTracks)) this.push(...trackOrTracks);
		else this.push(trackOrTracks);
	}

	public get totalSize() {
		return this.length + (this.current ? 1 : 0);
	}

	public get size() {
		return this.length;
	}

	public clear() {
		this.splice(0);
	}

	public shuffle() {
		for (let i = this.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this[i], this[j]] = [this[j], this[i]];
		}
	}
}

export function ValidateValidTracks(tracks: KirishimaPartialTrack | KirishimaTrack | (KirishimaPartialTrack | KirishimaTrack)[]) {
	if (Array.isArray(tracks)) {
		for (const track of tracks) {
			if (!(isTrack(track) || isPartialTrack(track))) return false;
		}
		return true;
	}

	return isTrack(tracks) || isPartialTrack(tracks);
}
