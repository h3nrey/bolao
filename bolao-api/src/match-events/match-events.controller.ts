import { Controller, Get, Post, Delete, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { MatchEventsService } from './match-events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createMatchEventSchema, CreateMatchEventDto } from './dto/match-event.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class MatchEventsController {
  constructor(private matchEventsService: MatchEventsService) {}

  @Get('matches/:matchId/events')
  async findAllForMatch(@Param('matchId') matchId: string) {
    return this.matchEventsService.findAllForMatch(matchId);
  }

  @Post('matches/:matchId/events')
  @UsePipes(new ZodValidationPipe(createMatchEventSchema))
  async create(
    @Param('matchId') matchId: string,
    @Body() dto: CreateMatchEventDto,
  ) {
    return this.matchEventsService.create(matchId, dto);
  }

  @Delete('match-events/:id')
  async remove(@Param('id') id: string) {
    return this.matchEventsService.remove(id);
  }
}
