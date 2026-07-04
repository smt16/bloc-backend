import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { mapAuth0Payload } from '../../modules/auth/auth0-user.mapper';
import { AuthenticatedUser } from '../../modules/auth/auth0.types';
import { Auth0TokenService } from '../../modules/auth/services/auth0-token.service';
import { InjectRedis } from '../redis/redis.decorator';

@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: '*' },
})
@Injectable()
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(EventsGateway.name);
  private readonly namespace: string;

  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private readonly auth0TokenService: Auth0TokenService,
    configService: ConfigService,
  ) {
    this.namespace = configService.getOrThrow<string>('auth0.namespace');
  }

  afterInit(server: Server): void {
    // For namespaced gateways the adapter must be attached to the root io
    // server. Guard so local dev without a reachable Redis (or an
    // incompatible server ref) degrades gracefully instead of crashing.
    const io: Server | undefined =
      (server as unknown as { server?: Server }).server ?? server;

    if (!io || typeof io.adapter !== 'function') {
      this.logger.warn(
        'WebSocket gateway started without a Redis adapter (adapter unavailable)',
      );
      return;
    }

    try {
      const pubClient = this.redisClient.duplicate();
      const subClient = this.redisClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      this.logger.log('WebSocket gateway initialized with Redis adapter');
    } catch (error) {
      this.logger.warn(
        `WebSocket gateway started without a Redis adapter: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.auth0TokenService.verify(token);
      const user = mapAuth0Payload(payload, this.namespace);

      (client.data as { user?: AuthenticatedUser }).user = user;
      this.logger.debug(`Client connected: ${client.id} (user: ${user.sub})`);
    } catch (error) {
      this.logger.debug(
        `WS handshake rejected: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      client.disconnect(true);
    }
  }
}
