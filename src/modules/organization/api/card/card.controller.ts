/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Post, Req } from '@nestjs/common';
import { CardCommandHandler } from '../../application/commands/card/handler/card-command.handler';
import { CreateCardDto } from '../dto/create-card.dto';
import { CreateCardCommand } from '../../application/commands/card/create-card.command';
import { UuidUtil } from 'src/shared/utils/uuid.util';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('card')
@Controller('card')
export class CardController {
  constructor(private readonly commandHandler: CardCommandHandler) {}

  @Post()
  async createCard(@Body() dto: CreateCardDto, @Req() req: any) {
    const command: CreateCardCommand = new CreateCardCommand(
      UuidUtil.generate(),
      dto.organizationId,
      dto.cardNumber,
      dto.dailyLimit,
      dto.monthlyLimit,
      req.correlationId,
    );
    return this.commandHandler.createCard(command);
  }
}
