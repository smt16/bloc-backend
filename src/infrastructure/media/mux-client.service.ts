import { Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mux from '@mux/mux-node';

@Injectable()
export class MuxClientService {
  private readonly client: Mux | null;

  constructor(private readonly configService: ConfigService) {
    const tokenId = this.configService.get<string>('mux.tokenId');
    const tokenSecret = this.configService.get<string>('mux.tokenSecret');

    this.client =
      tokenId && tokenSecret ? new Mux({ tokenId, tokenSecret }) : null;
  }

  createDirectUpload(): Promise<unknown> {
    if (!this.client) {
      throw new NotImplementedException('Mux is not configured');
    }

    return this.client.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
      },
    });
  }

  getAsset(assetId: string): Promise<unknown> {
    if (!this.client) {
      throw new NotImplementedException('Mux is not configured');
    }

    return this.client.video.assets.retrieve(assetId);
  }
}
