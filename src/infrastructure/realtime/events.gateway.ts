import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { InjectRedis } from '../redis/redis.decorator';

@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: '*' },
})
@Injectable()
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    const pubClient = this.redisClient.duplicate();
    const subClient = this.redisClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    this.logger.log('WebSocket gateway initialized with Redis adapter');
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

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        {
          secret: this.configService.getOrThrow<string>('jwt.secret'),
        },
      );

      (client.data as { userId?: string }).userId = payload.sub;
      this.logger.debug(
        `Client connected: ${client.id} (user: ${payload.sub})`,
      );
    } catch {
      client.disconnect(true);
    }
  }
}
