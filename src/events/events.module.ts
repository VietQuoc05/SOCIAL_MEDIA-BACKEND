import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Global() // ✅ QUAN TRỌNG: make global provider
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway], // ✅ để module khác dùng
})
export class EventsModule {}