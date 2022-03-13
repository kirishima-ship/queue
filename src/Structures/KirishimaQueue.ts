import { KirishimaPlugin, Structure } from '@kirishima/core';
import { KirishimaNode } from './KirishimaNode';
import { KirishimaPlayer } from './KirishimaPlayer';

export class KirishimaQueue extends KirishimaPlugin {
	public constructor() {
		super({
			name: 'KirishimaQueue'
		});
	}

	public load() {
		Structure.extend('KirishimaPlayer', () => KirishimaPlayer);
		Structure.extend('KirishimaNode', () => KirishimaNode);
	}
}
