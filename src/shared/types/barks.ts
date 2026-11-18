export type BarkSituation = 'horn' | 'shout' | 'push' | 'thanks' | 'bumped' | 'greeting';
export type BarkSpeaker = 'driver' | 'pedestrian';

export interface BarkDef {
  id: string;
  situation: BarkSituation;
  speaker: BarkSpeaker;
  text_en: string;
  text_pcm: string;
}
