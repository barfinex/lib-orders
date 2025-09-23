import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { ConnectorModule } from '@barfinex/connectors';

@Module({
    imports: [ConnectorModule],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule { }
